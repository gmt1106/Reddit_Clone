import { Request, Response } from "express";
import { Redis } from "ioredis";
import { DataSource } from "typeorm";

export type Context = {
  appDataSource: DataSource;
  req: Request & { session: Express.Request["session"] };
  redis: Redis;
  res: Response;
};
