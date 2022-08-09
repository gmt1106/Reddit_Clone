import { Post } from "../entities/post";
import { Resolver, Query, Arg, Mutation } from "type-graphql";

// Add functions that are mutation or query
@Resolver()
export class PostResolver {
  // get the list of all posts
  @Query(() => [Post]) // setting graphql return type with [Post]
  async posts(): Promise<Post[]> {
    // setting typescript return type with of post in promise
    // want to query everything from the database and return
    // find will return a promise of posts
    return Post.find();
  }

  // get a single post by id
  @Query(() => Post, { nullable: true })
  post(
    // argument
    @Arg("id") id: number
  ): Promise<Post | null> {
    return Post.findOne({ where: { id } });
  }

  // create a post
  @Mutation(() => Post)
  async createPost(@Arg("title") title: string): Promise<Post> {
    return Post.create({ title }).save();
  }

  // update a post
  @Mutation(() => Post, { nullable: true })
  async updatePost(
    @Arg("id") id: number,
    @Arg("title", () => String, { nullable: true }) title: string
  ): Promise<Post | null> {
    const post = await Post.findOne({ where: { id } });
    if (!post) {
      return null;
    }
    if (typeof title !== "undefined") {
      post.title = title;
      await Post.update({ id }, { title });
    }
    return post;
  }

  // delete a post
  @Mutation(() => Boolean)
  async deletePost(@Arg("id") id: number): Promise<boolean> {
    await Post.delete(id);
    return true;
  }
}
