import "dotenv-safe/config";
import { Context } from "../types";
import {
  Resolver,
  Mutation,
  Arg,
  Field,
  Ctx,
  ObjectType,
  Query,
  FieldResolver,
  Root,
} from "type-graphql";
import { User } from "../entities/User";
import argon2 from "argon2";
import { COOKIE_NAME, FORGOT_PASSWORD_PREFIX } from "../constants";
import { RegisterInput } from "./RegisterInput";
import { validateRegister } from "../utils/validateRegister";
import { sendEmail } from "../utils/sendEmail";
import { v4 as uuidv4 } from "uuid";

// ObjectType is for a return value
@ObjectType()
// Field error is for when th ere is something wrong with a particular field ex)password, email
// message is for to explain what is actaully wrong
class FieldError {
  @Field()
  field: string;

  @Field()
  message: string;
}

@ObjectType()
class UserResponse {
  // want to return User if the resolver worked properly and return error if not. That is why they have question mark, so that undefined type is possible.
  @Field(() => [FieldError], { nullable: true }) // explicit type is set to make it nullable.
  errors?: FieldError[];

  @Field(() => User, { nullable: true })
  user?: User;
}

// Add functions that are mutation or query
@Resolver(User)
export class UserResolver {
  // This FieldResolver is to set the field permissions, deciding to whom we will going to show the field
  @FieldResolver(() => String)
  email(@Root() user: User, @Ctx() { req }: Context) {
    // This is the current user and its oky to show them their own email
    if (req.session.userId === user.id) {
      return user.email;
    }
    // Current user wants to see someone else's email
    return "";
  }

  // Return current loged in user. If no one is logged in, return null.
  @Query(() => User, { nullable: true })
  me(@Ctx() { req }: Context) {
    // you are not logged in case
    if (!req.session.userId) {
      return null;
    }

    return User.findOne({ where: { id: req.session.userId } });
  }

  // Register an user
  @Mutation(() => UserResponse)
  async register(
    @Arg("registerInput") registerInput: RegisterInput,
    @Ctx() { appDataSource, req }: Context
  ): Promise<UserResponse> {
    // validate registerinput
    const errors = validateRegister(registerInput);
    if (errors) {
      return { errors };
    }
    // encrypt the password
    const hashedPassword = await argon2.hash(registerInput.password);
    let user;

    try {
      // User.create({
      // username: registerInput.username,
      // password: hashedPassword,
      // email: registerInput.email }).save()
      // this is the same as the above line
      const result = await appDataSource
        .createQueryBuilder()
        .insert()
        .into(User)
        .values({
          username: registerInput.username,
          password: hashedPassword,
          email: registerInput.email,
        })
        .returning("*") // return us back the field
        .execute();
      user = result.raw[0];
    } catch (err) {
      // duplicate username err
      if (err.code === "23505") {
        return {
          errors: [
            {
              field: "username",
              message: "username already taken",
            },
          ],
        };
      }
    }

    // store user id in the session (cookie)
    // auto log you in after registeration
    req.session.userId = user.id;

    return { user };
  }

  // log in as an user
  @Mutation(() => UserResponse)
  async login(
    @Arg("usernameOrEmail") usernameOrEmail: string,
    @Arg("password") password: string,
    @Ctx() { req }: Context
  ): Promise<UserResponse> {
    const user = await User.findOne({
      where: usernameOrEmail.includes("@")
        ? { email: usernameOrEmail }
        : { username: usernameOrEmail },
    });
    // handle error when no user is not found
    if (!user) {
      return {
        // handle more than one error
        errors: [
          {
            field: "usernameOrEmail",
            message: "that username or email doesn't exist",
          },
        ],
      };
    }
    const valid = await argon2.verify(user.password, password);
    // handle error when the password is incorrect
    if (!valid) {
      return {
        errors: [
          {
            field: "password",
            message: "incorrect password",
          },
        ],
      };
    }

    // store user id in the session (cookie)
    req.session.userId = user.id;

    /* note on how session works 
    1.  Stores the userId to the session.
        req.session.userId = user.id;

    2. Any data that is stored on the session, is stored on the redis.
        {userId: 1}  ->  send this to redis

    3. Redis is key-value store. Use a key to look up the matching value.
                key           ->     value
        sess:qlaskjfalwejflw  ->  {userId: 1}

    4. express-session will set a cookie on my browser 
        dkejalsfejf83js   This is the cookie. The cookie value is the encrypt version of the redis key.

    5. When a user makes a request, the cookie value is sent to the server
        dkejalsfejf83js is sent to the server 

    6. On the server the cookie value is decrypt using the secret that we set when we made the session.  
        secret: "kadfljskdjfiwoenvskdnvkdsgjlei"
        dkejalsfejf83js  ->  sess:qlaskjfalwejflw

    7. Make a request to redis
        sess:qlaskjfalwejflw  ->  {userId: 1}

    8. Store the data on the req.session
        req.session = {userId: 1}
    */

    // found a matching user and the password is correct
    return { user };
  }

  // log out
  @Mutation(() => Boolean)
  async logout(@Ctx() { req, res }: Context): Promise<Boolean> {
    // destroy function removes the session from the redis
    // this function requires a callback function
    return new Promise((resolve, _reject) =>
      // destroy function remove session from redis. It takes callback.
      req.session.destroy((err) => {
        // We also want to clear cookie, not just remove session from redis
        // still wants to clear the cookie even if destroying the session is failed
        res.clearCookie(COOKIE_NAME);
        if (err) {
          resolve(false);
          return;
        }
        resolve(true);
      })
    );
  }

  // change password because user forgot his password
  @Mutation(() => Boolean)
  async forgotPassword(
    @Arg("email") email: string,
    @Ctx() { redis }: Context
  ): Promise<Boolean> {
    const user = await User.findOne({ where: { email: email } });
    if (!user) {
      // user with the given email is not found in the database
      // but for scurity reason we don't want to let the user know this
      return true;
    }
    // user is found, so send him an email
    // With in the email, I will send a special link which will take the user to the website that the user can reset the password
    // In the link I need to put a token which will be used to validate the user who is accessing the webpage
    // The token can be generated using uuid
    const token = uuidv4();

    // store the token in redis with user.id
    await redis.set(
      FORGOT_PASSWORD_PREFIX + token,
      user.id,
      "PX",
      1000 * 60 * 15
    ); // expire after 15 mins
    // when the user access the link and change the password, it will send the token back to me,
    // and I can look up the user id with that token
    await sendEmail(email, changePasswordEmailHtml(token));
    return true;
  }

  @Mutation(() => UserResponse)
  async changePassword(
    @Arg("token") token: string,
    @Arg("newPassword") newPassword: string,
    @Ctx() { req, redis }: Context
  ): Promise<UserResponse> {
    // password shouldn't be empty
    if (newPassword.length <= 2) {
      return {
        errors: [
          {
            field: "newPassword",
            message: "length must be greater than 2",
          },
        ],
      };
    }

    // need to check token
    const key = FORGOT_PASSWORD_PREFIX + token;
    const userId = await redis.get(key);
    // There can be two case for userID not being exist. 1. token is expired  2. token is fake
    if (!userId) {
      return {
        errors: [
          {
            field: "token",
            message: "This change password link is expired",
          },
        ],
      };
    }

    // now the user is found, so change the password
    const userIdNum = parseInt(userId);
    const user = await User.findOne({ where: { id: userIdNum } });

    // user associated with the token no longer exist somehow
    if (!user) {
      return {
        errors: [
          {
            field: "token",
            message: "user no longer exists",
          },
        ],
      };
    }

    // encrypt the password
    await User.update(
      { id: userIdNum },
      { password: await argon2.hash(newPassword) }
    );

    // delete the token from the redis so that user can't reuse the link to change the password
    redis.del(key);

    // log in the user after change password
    req.session.userId = user.id;

    return { user };
  }
}

const changePasswordEmailHtml = (token: string) => {
  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">

<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset your password</title>
  <!--[if mso]><style type="text/css">body, table, td, a { font-family: Arial, Helvetica, sans-serif !important; }</style><![endif]-->
</head>

<body style="font-family: Helvetica, Arial, sans-serif; margin: 0px; padding: 0px; background-color: #ffffff;">
  <table role="presentation"
    style="width: 100%; border-collapse: collapse; border: 0px; border-spacing: 0px; font-family: Arial, Helvetica, sans-serif; background-color: rgb(239, 239, 239);">
    <tbody>
      <tr>
        <td align="center" style="padding: 1rem 2rem; vertical-align: top; width: 100%;">
          <table role="presentation" style="max-width: 600px; border-collapse: collapse; border: 0px; border-spacing: 0px; text-align: left;">
            <tbody>
              <tr>
                <td style="padding: 40px 0px 0px;">
                  <div style="text-align: left;">
                    <!---->
                  </div>
                  <div style="padding: 20px; background-color: rgb(255, 255, 255);">
                    <div style="color: rgb(0, 0, 0); text-align: left;">
                      <h1 style="margin: 1rem 0">Trouble signing in?</h1>
                      <p style="padding-bottom: 16px">We've received a request to reset the password for the user account with this email.</p>
                      <p style="padding-bottom: 16px"><a href="${process.env.CORS_ORIGIN}/change-password/${token}" target="_blank"
                          style="padding: 12px 24px; border-radius: 4px; color: #FFF; background: #008080 ;display: inline-block;margin: 0.5rem 0;">Reset
                          your password</a></p>
                      <p style="padding-bottom: 16px">If you didn't ask to reset your password, you can ignore this email.</p>
                      <p style="padding-bottom: 16px">Thanks,<br>The Reddit Clone team</p>
                    </div>
                  </div>
                  <div style="padding-top: 20px; color: rgb(153, 153, 153); text-align: center;"></div>
                </td>
              </tr>
            </tbody>
          </table>
        </td>
      </tr>
    </tbody>
  </table>
</body>

</html>`;
};
