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

  // make graphql end point
  // need to pass in graphql schema
  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [HelloResolver, PostResolver, UserResolver],
      validate: false,
    }),
    // it is a object that is accessable by all the resolver
    context: () => ({ em: orm.em }),
  });

  // add graphql end point on express
  await apolloServer.start();
  apolloServer.applyMiddleware({ app });

  //start local host 4000
  app.listen(4000, () => {
    console.log("server started on localhost:4000");
  });
};

main().catch((err) => {
  console.error(err);
});
