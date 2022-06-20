import { Context } from "../types";
import {
  Resolver,
  Mutation,
  Arg,
  InputType,
  Field,
  Ctx,
  ObjectType,
  Query,
} from "type-graphql";
import { User } from "../entities/User";
import argon2 from "argon2";

// argument or resolvers
// InputType is for an arugment
@InputType()
class UsernamePasswordInput {
  @Field()
  username: string;
  @Field()
  password: string;
}

// ObjectType is for a return value
@ObjectType()
// Field error is for when there is something wrong with a particular field ex)password, email
class FieldError {
  @Field()
  field: string;

  @Field()
  message: string;
}

@ObjectType()
class UserResponse {
  // want to return User if the resolver worked properly and return error if not
  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];

  @Field(() => User, { nullable: true })
  user?: User;
}

// Add functions that are mutation or query
@Resolver()
export class UserResolver {
  // Return current loged in user. If no one is logged in, return null.
  @Query(() => User, { nullable: true })
  async me(@Ctx() { em, req }: Context) {
    // you are not logged in case
    if (!req.session.userId) {
      return null;
    }

    const user = em.findOne(User, { id: req.session.userId });
    return user;
  }

  // Register an user
  @Mutation(() => UserResponse)
  async register(
    @Arg("registerInput") registerInput: UsernamePasswordInput,
    @Ctx() { em, req }: Context
  ): Promise<UserResponse> {
    // username shouldn't be empty
    if (registerInput.username.length <= 2) {
      return {
        errors: [
          {
            field: "username",
            message: "length must be greater than 2",
          },
        ],
      };
    }
    // password shouldn't be empty
    if (registerInput.password.length <= 2) {
      return {
        errors: [
          {
            field: "password",
            message: "length must be greater than 2",
          },
        ],
      };
    }
    const createdAt = new Date();
    const updatedAt = new Date();

    // encrypt the password
    const hashedPassword = await argon2.hash(registerInput.password);
    const user = em.create(User, {
      username: registerInput.username,
      password: hashedPassword,
      createdAt: createdAt,
      updatedAt: updatedAt,
    });

    try {
      await em.persistAndFlush(user);
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

  // log in an user
  @Mutation(() => UserResponse)
  async login(
    @Arg("loginInput") loginInput: UsernamePasswordInput,
    @Ctx() { em, req }: Context
  ): Promise<UserResponse> {
    const user = await em.findOne(User, { username: loginInput.username });
    // handle error when no user is not found
    if (!user) {
      return {
        // handle more than one error
        errors: [
          {
            field: "username",
            message: "that username doesn't exist",
          },
        ],
      };
    }
    const valid = await argon2.verify(user.password, loginInput.password);
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

    /* note on how cookies work 
    1.  Stores the userId to the session.
        req.session.userId = user.id;

    2. Any data that is stored on the session, is stored on the redis.
        {userId: 1}  ->  send this to redis

    3. Redis is key-value store. Use a key to look up the matching value.
                key           ->     value
        sess:qlaskjfalwejflw  ->  {userId: 1}

    4. express-session will set a cookie on my browser 
        dkejalsfejf83js   This is the cookie. The cookie value is the encrypt version of redis key.

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
    return {
      user,
    };
  }
}
