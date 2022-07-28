import { Entity, PrimaryKey, Property } from "@mikro-orm/core";
import { Field, ObjectType } from "type-graphql";

// add a decorator to make entity as a graphql type so we can pass to the resolver
@ObjectType()
@Entity()
export class User {
  // They are database columns in the Post table
  // removing this decorator will cause graphql not expose this field
  @Field()
  @PrimaryKey()
  id!: number;

  @Field(() => String)
  @Property({ type: "date" })
  createdAt: Date = new Date();

  @Field(() => String)
  @Property({ type: "date", onUpdate: () => new Date() })
  updatedAt: Date = new Date();

  @Field()
  @Property({ type: "text", unique: true })
  username!: string;

  // remove field property = not allow the client to select password
  // only save in dotabase column
  @Property({ type: "text" })
  password!: string;

  @Field()
  @Property({ type: "text", unique: true })
  email!: string;
}
