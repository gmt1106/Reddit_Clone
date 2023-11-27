import { Field, ObjectType } from "type-graphql";
import {
  BaseEntity, // allow us to have easy commands that we can run to run sql ex) Post.find() , Post.insert() which are used in resolvers
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { User } from "./User";

// add a decorator to make entity as a graphql type so we can pass to the resolver
@ObjectType()
@Entity()
export class Post extends BaseEntity {
  // They are database columns in the Post table
  // removing this decorator will cause graphql not expose this field
  @Field()
  @PrimaryGeneratedColumn()
  id!: number;

  @Field()
  @Column()
  title!: string;

  @Field()
  @Column()
  text!: string;

  @Field()
  @Column({ type: "int", default: 0 })
  points!: number;

  @Field()
  // set up a foreign key in the User table
  @ManyToOne(() => User, (user) => user.posts)
  creator: User;

  // store the foregin key as creatorId
  @Field()
  @Column()
  creatorId: number;

  @Field(() => String)
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => String)
  @UpdateDateColumn()
  updatedAt: Date;
}
