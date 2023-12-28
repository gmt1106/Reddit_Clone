import "reflect-metadata"; // typeorm need this
// read in .env file and fill up the environment variable, and also looks at the .env.example file and throw error if not all of the environment variables exist
// In the prod, instead of this library, dokku will fill up the environment variables
import "dotenv-safe/config";
import { COOKIE_NAME, __prod__ } from "./constants";
import express from "express";
// make graphql end point
import { ApolloServer } from "apollo-server-express";
// create graphql schema
import { buildSchema } from "type-graphql";
import { HelloResolver } from "./resolvers/hello";
import { PostResolver } from "./resolvers/post";
import { UserResolver } from "./resolvers/user";
import Redis from "ioredis";
import session from "express-session";
import connectRedis from "connect-redis";
import { Context } from "./types";
// to set cors globally in express middleware not in apollo server middleware
import cors from "cors";
import { createUserLoader } from "./utils/createUserLoader";
import { createUpVoteLoader } from "./utils/createUpVoteLoader";
import { appDataSource } from "./ormconfig";

// things you want to store in session
declare module "express-session" {
  interface SessionData {
    userId: number;
  }
}

const main = async () => {
  // to initialize initial connection with the database, register all entities
  // and "synchronize" database schema, call "initialize()" method of a newly created database
  // once in your application bootstrap
  appDataSource
    .initialize()
    .then(() => {
      // here you can start to work with your database
      console.log("Data Source has been initialized!");

      // run migration
      appDataSource.runMigrations();

      // clear Post table
      // await Post.delete({});
    })
    .catch((error) =>
      console.log("Error during Data Source initialization", error)
    );

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
  const redis = new Redis(process.env.REDIS_URL);

  // To get cookies working in a proxy environment, we need to tell express how many proxy sitting in front
  // We are going to have an engine x stting in front of our api.
  app.set("trust proxy", 1);

  // ********** this is a setting for the Apollo Studio and next.js app local host to connect server by settting cors globally in express middleware **********
  app.use(
    // this way cors will be applied to all routes
    // if you don't want that, you need to specify the route that you want
    // ex) '/'
    cors({
      credentials: true,
      //for apollo origin: "https://studio.apollographql.com"
      origin: [process.env.CORS_ORIGIN],
    })
  );

  app.use(
    session({
      name: COOKIE_NAME,
      // disableTouch ture make the session live forever also reduce the number of request
      store: new RedisStore({ client: redis as any, disableTouch: true }),
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 365 * 10, // 10 years
        httpOnly: true, // from the javascript code in the frontend, can't access the cookie. This is good for security reason.
        sameSite: "lax", // protecting in csrf
        secure: __prod__, // cookie only works in https. Off when it is connect to local host
        domain: __prod__ ? process.env.COOKIE_DOMAIN : undefined,
        // ********** this is a setting for the Apollo Studio to send cookies **********
        // sameSite: "none",
        // secure: true,
      },
      saveUninitialized: false, // means when the value is set to true, it will create session by default even if you didn't store any data in it
      secret: process.env.SESSION_SECRET,
      resave: false,
    })
  );

  // ********** this is a setting for the Apollo Studio to send cookies **********
  // app.set("trust proxy", !__prod__);

  // make graphql end point
  // need to pass in graphql schema
  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [HelloResolver, PostResolver, UserResolver],
      validate: false,
    }),
    // it is a object that is accessable by all resolvers
    // we can access the session(cookie) inside the resolver by passing in req and res
    // Note that context will be run every request, so new userLoader will be created every request, so it batches in caches loading of users within a single request.
    context: ({ req, res }): Context => ({
      appDataSource,
      req,
      res,
      redis,
      userLoader: createUserLoader(),
      upVoteLoader: createUpVoteLoader(),
    }),
  });

  // add graphql end point on express
  await apolloServer.start();
  apolloServer.applyMiddleware({
    app,
    // ********** this is a setting for the Apollo Studio and next.js app local host to connect server by settting cors in apollo server middleware **********
    // cors: {
    //   credentials: true,
    //   origin: ["http://localhost:3000", "https://studio.apollographql.com"],
    // },

    // ********** this is a setting for the Apollo Studio and next.js app local host to connect server by settting cors globally in express middleware **********
    cors: false,
  });

  //start local host 4000
  app.listen(parseInt(process.env.PORT), () => {
    console.log("🚀 server started on localhost:4000");
  });
};

main().catch((err) => {
  console.error(err);
});
