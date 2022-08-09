import { Field, ObjectType } from "type-graphql";
import {
  BaseEntity, // allow us to have easy commands that we can run to run sql ex) Post.find() , Post.insert() which are used in resolvers
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

// add a decorator to make entity as a graphql type so we can pass to the resolver
@ObjectType()
@Entity()
export class Post extends BaseEntity {
  // They are database columns in the Post table
  // removing this decorator will cause graphql not expose this field
  @Field()
  @PrimaryGeneratedColumn()
  id!: number;

  @Field(() => String)
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => String)
  @UpdateDateColumn()
  updatedAt: Date;

  @Field()
  @Column()
  title!: string;
}
