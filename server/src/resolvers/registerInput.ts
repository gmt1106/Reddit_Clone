import { InputType, Field } from "type-graphql";

// arguments of resolvers
// InputType is for arguments

@InputType()
export class RegisterInput {
  @Field()
  email: string;
  @Field()
  username: string;
  @Field()
  password: string;
}
