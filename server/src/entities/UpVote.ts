import { BaseEntity, Column, Entity, ManyToOne, PrimaryColumn } from "typeorm";
import { Post } from "./Post";
import { User } from "./User";

// many to many relationship
// this is a relationship between user and post. Several users can up vote one post, and one user cna up vote many posts.
// in many to many relationship, we need a join table which we will call upVoate.
// user -> upVote <- post
@Entity()
export class UpVote extends BaseEntity {
  // for the join table, we don't need PrimaryGeneratedColumn but we just need PrimaryColumn
  // the primaryColumn is decided based off of foreign key
  // each row in the table in DB is unique by userId and postId

  @PrimaryColumn()
  userId: number;

  @ManyToOne(() => User, (user) => user.upVotes)
  user: User;

  @PrimaryColumn()
  postId: number;

  @ManyToOne(() => Post, (post) => post.upVotes)
  post: Post;

  // This indicate if this entity for is for up vote or down vote
  @Column({ type: "int" })
  value: number;
}
