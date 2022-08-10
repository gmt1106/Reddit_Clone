import { Context } from "src/types";
import { MiddlewareFn } from "type-graphql";

// This MiddlewareFn type of function runs before resolvers
export const isAuth: MiddlewareFn<Context> = ({ context }, next) => {
  if (!context.req.session.userId) {
    throw new Error("not authorized");
  }

  return next();
};
