import "reflect-metadata";
import { MikroORM } from "@mikro-orm/core";
import { __prod__ } from "./constants";
import microConfig from "./mikro-orm.config";
import express from "express";
// make graphql end point
import { ApolloServer } from "apollo-server-express";
// create graphql schema
import { buildSchema } from "type-graphql";
import { HelloResolver } from "./resolvers/hello";
import { PostResolver } from "./resolvers/post";
import { UserResolver } from "./resolvers/user";
import * as redis from "redis";
import session from "express-session";
import connectRedis from "connect-redis";
import { Context } from "./types";

// things I want to store in session
declare module "express-session" {
  interface SessionData {
    userId: number;
  }
}

const main = async () => {
  // connect to the database
  const orm = await MikroORM.init(microConfig);
  // automatically run the migration in this code
  await orm.getMigrator().up();

  // // run sql
  // // this create an instance of post class
  // const post = orm.em.fork({}).create(Post, {title: "my first post", createdAt: new Date(), updatedAt: new Date()});
  // // insert new post row to database
  // await orm.em.persistAndFlush(post);

  // // print out the Post that has beed added
  // const posts = await orm.em.find(Post, {});
  // console.log(posts);

  // express build rest api
  const app = express();

  // // add get rest end point on express
  // app.get("/", (_, res) => {
  //   res.send("hello");
  // })

  // Cookie
  // Place in between app declaration and applyMiddleware to apolloServer
  // Session middleware will run before apollo middleware.
  // We need becase session middleware will run inside the apollo
  const RedisStore = connectRedis(session);
  const redisClient = redis.createClient({ legacyMode: true });
  redisClient.connect().catch(console.error);

  app.use(
    session({
      name: "myCookies",
      // disableTouch ture make the session live forever also reduce the number of request
      store: new RedisStore({ client: redisClient as any, disableTouch: true }),
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 365 * 10, // 10 years
        httpOnly: true, // from the javascript code in the frontend, can't access the cookie
        // sameSite: "lax", // csrf
        // secure: __prod__, // cookie only wors in https. Off when it is connect to local host
        // This is for setting the Apollo Studio to allow cookies
        sameSite: "none",
        secure: true,
      },
      saveUninitialized: false, // means it will create session by default even if I didn't store any data in it
      secret: "kadfljskdjfiwoenvskdnvkdsgjlei",
      resave: false,
    })
  );

  // This is for setting the Apollo Studio to allow cookies
  app.set("trust proxy", !__prod__);

  // make graphql end point
  // need to pass in graphql schema
  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [HelloResolver, PostResolver, UserResolver],
      validate: false,
    }),
    // it is a object that is accessable by all the resolver
    // we can access the session(cookie) inside the resolver by passing in req and res
    context: ({ req, res }): Context => ({ em: orm.em, req, res }),
  });

  // add graphql end point on express
  await apolloServer.start();
  apolloServer.applyMiddleware({
    app,
    // This is for setting the Apollo Studio to allow cookies
    cors: { credentials: true, origin: "https://studio.apollographql.com" },
  });

  //start local host 4000
  app.listen(4000, () => {
    console.log("server started on localhost:4000");
  });
};

main().catch((err) => {
  console.error(err);
});
