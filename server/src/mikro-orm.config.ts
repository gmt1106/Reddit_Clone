import { __prod__ } from "./constants";
import { Post } from "./entities/post";
import { MikroORM } from "@mikro-orm/core";
import path from "path"; //function build into node
import { User } from "./entities/User";

export default {
  allowGlobalContext: true,
  migrations: {
    path: path.join(__dirname, "./migrations"), // path to the folder with migrations. __dirname = absolute path to the directory of this file.
    pattern: /^[\w-]+\d+\.[tj]s$/, // deal with both typescript and javascript
  },
  entities: [Post, User],
  dbName: "lireddit",
  user: "postgres",
  password: "Juho19971106",
  type: "postgresql",
  debug: !__prod__,
} as Parameters<typeof MikroORM.init>[0]; // control + space = let you knwo what you can add
