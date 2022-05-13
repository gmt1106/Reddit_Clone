import { Context } from "../types";
import { Resolver, Mutation, Arg, InputType, Field, Ctx } from "type-graphql";
import { User } from "../entities/User";
import argon2 from "argon2";

// argument or resolvers
@InputType()
class RegisterInput {
  @Field()
  username: string;
  @Field()
  password: string;
}

// Add functions that are mutation or query
@Resolver()
export class UserResolver {
  @Mutation(() => User)
  async register(
    @Arg("registerInput") registerInput: RegisterInput,
    @Ctx() { em }: Context
  ): Promise<User> {
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
    return user;
  }
}
