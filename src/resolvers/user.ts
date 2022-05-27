import { Context } from "../types";
import {
  Resolver,
  Mutation,
  Arg,
  InputType,
  Field,
  Ctx,
  ObjectType,
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
  @Mutation(() => UserResponse)
  async register(
    @Arg("registerInput") registerInput: UsernamePasswordInput,
    @Ctx() { em }: Context
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
    if (registerInput.username.length <= 2) {
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

    await em.persistAndFlush(user);
    return { user };
  }

  @Mutation(() => UserResponse)
  async login(
    @Arg("loginInput") loginInput: UsernamePasswordInput,
    @Ctx() { em }: Context
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

    // found a matching user and the password is correct
    return {
      user,
    };
  }
}
