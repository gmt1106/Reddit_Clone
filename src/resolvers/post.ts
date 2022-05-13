import { Post } from "../entities/post";
import { Resolver, Query, Ctx, Arg, Mutation } from "type-graphql";
import { Context } from "../types";

// Add functions that are mutation or query
@Resolver()
export class PostResolver {
  // get the list of all posts
  @Query(() => [Post]) // setting graphql return type with [Post]
  posts(@Ctx() { em }: Context): Promise<Post[]> {
    // setting typescript return type with of post in promise
    // want to query everything from the database and return
    // find will return a promise of posts
    return em.find(Post, {});
  }

  // get a single post by id
  @Query(() => Post, { nullable: true })
  post(
    // argument
    @Arg("id") id: number,
    @Ctx() { em }: Context
  ): Promise<Post | null> {
    return em.findOne(Post, { id });
  }

  // create a post
  @Mutation(() => Post)
  async createPost(
    @Arg("title") title: string,
    @Ctx() { em }: Context
  ): Promise<Post> {
    const createdAt = new Date();
    const updatedAt = new Date();
    const post = em.create(Post, { title, createdAt, updatedAt });
    await em.persistAndFlush(post);
    return post;
  }

  // update a post
  @Mutation(() => Post, { nullable: true })
  async updatePost(
    @Arg("id") id: number,
    @Arg("title", () => String, { nullable: true }) title: string,
    @Ctx() { em }: Context
  ): Promise<Post | null> {
    const post = await em.findOne(Post, { id });
    if (!post) {
      return null;
    }
    if (typeof title !== "undefined") {
      post.title = title;
      await em.persistAndFlush(post);
    }
    return post;
  }

  // delete a post
  @Mutation(() => Boolean)
  async deletePost(
    @Arg("id") id: number,
    @Ctx() { em }: Context
  ): Promise<boolean> {
    await em.nativeDelete(Post, { id });
    return true;
  }
}
