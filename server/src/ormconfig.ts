import { DataSource } from "typeorm";
import { Post } from "./entities/Post";
import { User } from "./entities/User";
import path from "path";
import { UpVote } from "./entities/UpVote";

// TypeORM's DataSource holds the database connection settings and establishes initial database connection
export const appDataSource = new DataSource({
  type: "postgres",
  //   username: "redditclone",
  //   password: "redditclone1106",
  //   database: "redditclone",
  url: process.env.DATABASE_URL,
  entities: [Post, User, UpVote],
  // synchronize: true, // TypeORM will create table automatically, don't have to run migratioin
  logging: true,
  migrations: [path.join(__dirname, "./migrations/*")],
});
