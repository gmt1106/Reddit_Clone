import { Post } from "../entities/Post";
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
import { UpVote } from "../entities/UpVote";
import { User } from "../entities/User";

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
    if (root.text.length > 50) {
      return root.text.slice(0, 50) + "...";
    }
    return root.text;
  }

  // Given a post, find the user that created the post.
  // Now we are fetching User no matter where the post is coming from
  @FieldResolver(() => User)
  creator(@Root() post: Post, @Ctx() { userLoader }: Context) {
    // without data loader
    // return User.findOne({ where: { id: post.creatorId } });

    // with data loader
    return userLoader.load(post.creatorId);
  }
  // The problem with this field resolver is that when we load the home page, there will be one query to get n number of posts (differ by pagination),
  // and n number of fetch query runs, one for each post to get creator user.
  // This is bad, so to improve this, we use data loader. The data loader will batch that n query requests into a single sql statement.
  // Therefore to load the home page, there will be one query to get posts and one query to get users

  // get the list of all posts
  @Query(() => PaginatedPosts) // setting graphql return type with [Post]
  async posts(
    // Arguments for pagination
    @Arg("limit", () => Int) limit: number,
    // Note that very first time we fetch posts, we are not going to have cursor so must be nullable
    @Arg("cursor", () => String, { nullable: true }) cursor: string | null, // This is string type but the value will be the Date the post is created in milisecond
    @Ctx() { req }: Context
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

    const replacements: any[] = [realLimitPlusOne];

    if (cursor) {
      replacements.push(new Date(parseInt(cursor)));
    }

    ///////// To impove the method that we are using raw sql, use field resolver, creator()
    const posts = await appDataSource.query(
      `
    select p.*, 
      ${
        req.session.userId
          ? `(select value from up_vote where "userId" = ${req.session.userId} and "postId" = p.id) "voteStatus"`
          : 'null as "voteStatus"'
      }
    from post p
    ${cursor ? `where p."createdAt" < $2` : ""} 
    order by p."createdAt" DESC
    limit $1
    `,
      replacements
    );

    // ///////// Write raw sql when query builder is not working
    // In postgresql, there are multiple schemas that can be inside of your database, so you need to specify that you want the public schema for user table => public.user
    // graphql wants creator objact instead of just username column value from user table. In the postgresql, there is a handy feature that we can tell we want json object back instead of just a column value.
    // => json_build_object('username', u.username) creator      this means create an object called "creator" which has a field named "username" with value u.username. creator name is from grapql defintion in Post.ts.
    // This is good way to fetch your data in graphql when you have relationships. Write a join and have a big query and that will grab all of your data. Then you don't have to worry about caching and data loader.
    // The down side of this method is that you get creator object even if you didn't specify that you want to fetch that in the client side.
    // const posts = await appDataSource.query(
    //   `
    // select p.*,
    // json_build_object(
    //   'id', u.id,
    //   'username', u.username,
    //   'email', u.email,
    //   'createdAt', u."createdAt",
    //   'updatedAt', u."updatedAt"
    //   ) creator,
    //   ${
    //     req.session.userId
    //       ? `(select value from up_vote where "userId" = ${req.session.userId} and "postId" = p.id) "voteStatus"`
    //       : 'null as "voteStatus"'
    //   }
    // from post p
    // inner join public.user u on u.id = p."creatorId"
    // ${cursor ? `where p."createdAt" < $2` : ""}
    // order by p."createdAt" DESC
    // limit $1
    // `,
    //   replacements
    // );
    /*
    Advantages of fetching data with sql query:
    1. pretty simple
    2. in general good in performance 

    Disadvantages
    1. Always fetching creator with join enven when we don't need it
    2. It is better to spread out one big query into multiple smaller queries. if you take a look, logic for fetching creator is duplicated. It has the same logic with post().

    So use the method that is using the field resolver
    */

    // ///////// Using query builder to create sql query
    // const queryBuilder = appDataSource
    //   .getRepository(Post)
    //   .createQueryBuilder("p")
    //   // Inner and left joins https://typeorm.io/select-query-builder#inner-and-left-joins
    //   .innerJoinAndSelect("p.creator", "u", 'u.id = p."creatorId"')
    //   .orderBy('p."createdAt"', "DESC")
    //   .take(realLimitPlusOne);
    // // if cursor exists
    // if (cursor) {
    //   queryBuilder.where('p."createdAt" < :cursor', {
    //     // need the format milisecond into Date form
    //     cursor: new Date(parseInt(cursor)),
    //   });
    // }
    // // Fetch 21 posts according to the realLimitPlusOne value and slice last one when we return to the client.
    // // getMany(); is the function that actaully executes the sql
    // const posts = await queryBuilder.getMany();

    console.log(posts);
    return {
      posts: posts.slice(0, realLimit), // sclie to only 20 posts
      hasMore: posts.length === realLimitPlusOne, // find out if there is next page or not
    };
  }

  // get a single post by id
  @Query(() => Post, { nullable: true })
  post(
    // argument
    @Arg("id", () => Int) id: number
  ): Promise<Post | null> {
    ///////// With field resolver, creator()
    return Post.findOne({ where: { id } });

    // ///////// Without field resolver, creator()
    // return Post.findOne({ where: { id }, relations: ["creator"] });
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
  @UseMiddleware(isAuth)
  async updatePost(
    @Arg("id", () => Int) id: number,
    @Arg("title") title: string,
    @Arg("text") text: string,
    @Ctx() { req }: Context
  ): Promise<Post | null> {
    const result = await appDataSource
      .createQueryBuilder()
      .update(Post)
      .set({ title, text })
      .where('id = :id and "creatorId" = :creatorId', {
        id,
        creatorId: req.session.userId,
      })
      .returning("*")
      .execute();

    return result.raw[0];
  }

  // delete a post
  @Mutation(() => Boolean)
  @UseMiddleware(isAuth) // users can't call delete post if they are not logged in
  async deletePost(
    @Arg("id", () => Int) id: number,
    @Ctx() { req }: Context
  ): Promise<boolean> {
    ////////// delete without cascade way
    // const post = await Post.findOne({ where: { id } });
    // // If a post with given id does not exist
    // if (!post) {
    //   return false;
    // }
    // // If creator of the post is not the logged in user
    // if (post.creatorId !== req.session.userId) {
    //   throw new Error("not authroized");
    // }
    // // Delete the record in up_vote table that use post id as foreign key
    // await UpVote.delete({ postId: id });
    // // Elements in {} are for where condition in sql query
    // // User can delete post only if they own it
    // await Post.delete({ id, creatorId: req.session.userId });

    ////////// delete with cascade way
    // update the UpVote entity
    await Post.delete({ id, creatorId: req.session.userId });
    return true;
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth) // only able to vote when you are logged in
  async vote(
    @Arg("postId", () => Int) postId: number,
    @Arg("value", () => Int) value: number,
    @Ctx() { req }: Context
  ) {
    const isUpVote = value > 0;
    const realValue = isUpVote ? 1 : -1; // even if they up vote to 30, it will only increase by one
    const { userId } = req.session;

    // Find if the entry already in DB
    const upVote = await UpVote.findOne({ where: { postId, userId } });

    // The user alreay voted the post before and they are try to up change their vote from up vote to down vote or from down vote to up vote
    if (upVote && upVote.value !== realValue) {
      await appDataSource.transaction(async (tm) => {
        // update the existing entry in UpVote table
        await tm.query(
          `
          update up_vote 
          set value = $1
          where "postId" = $2 and "userId" = $3
          `,
          [realValue, postId, userId]
        );
        // update post's point column
        // If someone change from up vote to down vote, then we need to remove one up vote and add one down vote so we need to subtract two points from the post point
        // Similarly, if some one change from down vote to up vote, then we need to add two points to the post point
        await tm.query(
          `
        update post
        set points = points + $1
        where id = $2
        `,
          [2 * realValue, postId]
        );
      });
    } else if (!upVote) {
      // The user never voted before.
      // Using the transaction function, typeorm deal with the error occuring during query
      await appDataSource.transaction(async (tm) => {
        // add a new entry in UpVote table
        await tm.query(
          `
        insert into up_vote ("userId", "postId", value)
        values ($1, $2, $3)
        `,
          [userId, postId, realValue]
        );
        // update post's point column
        await tm.query(
          `
        update post
        set points = points + $1
        where id = $2
        `,
          [realValue, postId]
        );
      });
    }

    // When users try to up vote that they already up voted or down vote that they already down voted then nothing will happen

    return true;
  }
}
