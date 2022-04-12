import { MikroORM } from "@mikro-orm/core";
import { __prod__ } from "./constants";
import { Post } from "./entities/post";
import microConfig from "./mikro-orm.config";

const main = async () => {
  const orm = await MikroORM.init(microConfig);

  // this create an instance of post class
  const post = orm.em.create(Post, {title: 'my first post', createdAt: new Date(), updatedAt: new Date()});
  // insert new post row to database
  await orm.em.persistAndFlush(post);
};

main().catch((err) => { console.error(err)});