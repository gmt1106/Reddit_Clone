import { Connection, EntityManager, IDatabaseDriver } from "@mikro-orm/core";
import { Request, Response } from "express";
import { Redis } from "ioredis";

export type Context = {
  em: EntityManager<IDatabaseDriver<Connection>>;
  req: Request & { session: Express.Request["session"] };
  redis: Redis;
  res: Response;
};
