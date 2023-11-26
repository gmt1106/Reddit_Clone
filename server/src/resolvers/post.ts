import { Post } from "../entities/post";
import {
  Resolver,
  Query,
  Arg,
  Mutation,
  InputType,
  Field,
  Ctx,
  UseMiddleware,
  Int,
  FieldResolver,
  Root,
  ObjectType,
} from "type-graphql";
import { Context } from "src/types";
import { isAuth } from "../middleware/isAuth";
import { appDataSource } from "../index";

@InputType()
class createPostInput {
  @Field()
  title: string;

  @Field()
  text: string;
}

@ObjectType()
class PaginatedPosts {
  @Field(() => [Post])
  posts: Post[];

  @Field()
  hasMore: boolean;
}

// Add functions that are mutation or query
@Resolver(Post) // state what we are resloving, Post
export class PostResolver {
  // This is not a field that is in DB. We are going to just create and send to the client
  // Not sending the whole text body of each post but sending snippet of it.
  @FieldResolver(() => String)
  textSnippet(@Root() root: Post) {
    return root.text.slice(0, 50);
  }

  // get the list of all posts
  @Query(() => PaginatedPosts) // setting graphql return type with [Post]
  async posts(
    // Arguments for pagination
    @Arg("limit", () => Int) limit: number,
    // Note that very first time we fetch posts, we are not going to have cursor so must be nullable
    @Arg("cursor", () => String, { nullable: true }) cursor: string | null // This is string type but the value will be the Date the post is created in milisecond
  ): Promise<PaginatedPosts> {
    // setting typescript return type with of post in promise
    // want to query everything from the database and return
    // find will return a promise of posts
    // return Post.find();
    // Update Post.find() to support pagination
    // source: https://typeorm.io/select-query-builder#what-is-querybuilder

    // Cap the limit to 50.
    const realLimit = Math.min(50, limit) + 1;
    // If the realLimit is 20 then fetch 21 posts. By this was we can tell if next page to fetch is there or not.
    const realLimitPlusOne = realLimit + 1;
    // we can look at the sql that is generated and if we don't like it we can write sql by ourselves
    const queryBuilder = appDataSource
      .getRepository(Post)
      .createQueryBuilder("p")
      .orderBy('"createdAt"', "DESC")
      .take(realLimitPlusOne);

    // if cursor exists
    if (cursor) {
      queryBuilder.where('"createdAt" < :cursor', {
        // need the format milisecond into Date form
        cursor: new Date(parseInt(cursor)),
      });
    }

    // Fetch 21 posts according to the realLimitPlusOne value and slice last one when we return to the client.
    const posts = await queryBuilder.getMany();
    // getMany(); is the function that actaully executes the sql
    return {
      posts: posts.slice(0, realLimit), // sclie to only 20 posts
      hasMore: posts.length === realLimitPlusOne, // find out if there is next page or not
    };
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
  @UseMiddleware(isAuth) // Check if the user is logged in, before making a post
  async createPost(
    @Arg("createPostInput") createPostInput: createPostInput,
    @Ctx() { req }: Context
  ): Promise<Post> {
    return Post.create({
      ...createPostInput,
      creatorId: req.session.userId, // we know who the user is so we pass it in as a creatorId to create a post. This is a common practice.
    }).save();
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
