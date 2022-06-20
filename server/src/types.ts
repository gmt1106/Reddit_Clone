import { Connection, EntityManager, IDatabaseDriver } from "@mikro-orm/core";
import { Request, Response } from "express";

export type Context = {
  em: EntityManager<IDatabaseDriver<Connection>>;
  req: Request & { session: Express.Request["session"] };
  res: Response;
};
