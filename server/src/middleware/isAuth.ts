import { Context } from "src/types";
import { MiddlewareFn } from "type-graphql";

// This MiddlewareFn is type of function that runs before resolvers
// this MiddlewareFn is a special type from type-graphql

// this is the middleware function that raps all resolvers and check if users are authenticated
export const isAuth: MiddlewareFn<Context> = ({ context }, next) => {
  if (!context.req.session.userId) {
    throw new Error("not authorized");
  }

  // call when everything is good
  return next();
};
