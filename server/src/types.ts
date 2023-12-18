import { Request, Response } from "express";
import { Redis } from "ioredis";
import { DataSource } from "typeorm";
import { createUpVoteLoader } from "./utils/createUpVoteLoader";
import { createUserLoader } from "./utils/createUserLoader";

export type Context = {
  appDataSource: DataSource;
  req: Request & { session: Express.Request["session"] };
  redis: Redis;
  res: Response;
  userLoader: ReturnType<typeof createUserLoader>;
  upVoteLoader: ReturnType<typeof createUpVoteLoader>;
};
