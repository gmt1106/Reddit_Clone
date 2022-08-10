import { Cache, cacheExchange, QueryInput } from "@urql/exchange-graphcache";
import Router from "next/router";
import { dedupExchange, Exchange, fetchExchange } from "urql";
import { pipe, tap } from "wonka";
import {
  LoginMutation,
  LogoutMutation,
  MeDocument,
  MeQuery,
  RegisterMutation,
} from "../generated/graphql";

// This will allow us to catch all errors.
// A way to deal with general error.
export const errorExchange: Exchange =
  ({ forward }) =>
  (ops$) => {
    return pipe(
      forward(ops$),
      tap(({ error }) => {
        if (error?.message.includes("not authorized")) {
          Router.replace("/login"); // outside of react so use global router // replce = replace the current route // push  = push on a new entry on the stack
        }
      })
    );
  };

export const createUrqlClient = (ssrExchange: any) => ({
  // client is my graphQL server
  url: "http://localhost:4000/graphql",
  fetchOptions: {
    credentials: "include" as const, // send a cookie
  },
  // The Graphcache package exports the cacheExchange which replaces the default cacheExchange in @urql/core.
  // The code snippet is from urql > graphcache > cache update
  exchanges: [
    dedupExchange,
    cacheExchange({
      updates: {
        Mutation: {
          // this is the function that we can do update cache
          // more precisely, this is going to run whenever LoginMutation runs and it is going to update the cache
          // update the cache means that updating the MeQuery because in the NavBar.txs, NavBar uses the result of the MeQuery.
          // the name of the funciton (login) need to match with the mutation after which we want to do cache update
          login: (loginResult, _args, cache, _info) => {
            // **** Before using the helper function ****
            // cache.update is an immer function https://blog.logrocket.com/immutability-in-react-with-immer/
            // cache.updateQuery({ query: MeDocument }, (data: any) => {
            //   // update data here
            //   data.username = "ben";
            // });
            // **** After using the helper function ****
            typedUpdateQuery<LoginMutation, MeQuery>(
              cache,
              { query: MeDocument },
              loginResult,
              (result, query) => {
                if (result.login.errors) {
                  return query;
                } else {
                  return {
                    me: result.login.user,
                  };
                }
              }
            );
          },
          register: (registerResult, _args, cache, _info) => {
            typedUpdateQuery<RegisterMutation, MeQuery>(
              cache,
              { query: MeDocument },
              registerResult,
              (result, query) => {
                if (result.register.errors) {
                  return query;
                } else {
                  return {
                    me: result.register.user,
                  };
                }
              }
            );
          },
          logout: (logoutResult, _args, cache, _info) => {
            // need to update me query to null
            typedUpdateQuery<LogoutMutation, MeQuery>(
              cache,
              { query: MeDocument },
              logoutResult,
              () => {
                return {
                  me: null,
                };
              }
            );
          },
        },
      },
    }),
    errorExchange,
    ssrExchange,
    fetchExchange,
  ],
});

// Since graphcache cache.updateQuery does not support typescript type, define a helper function that makes it easy to cast the types
// <Result, Query> these are generics https://www.typescriptlang.org/docs/handbook/2/generics.html
function typedUpdateQuery<Result, Query>(
  cache: Cache,
  qi: QueryInput, // the first parameter of the cache.updateQuery()
  result: any,
  fn: (r: Result, q: Query) => Query // this function is properly typed. Take Result type and Query type input and return updated q which is a Query type.
) {
  return cache.updateQuery(qi, (data) => fn(result, data as any) as any);
}
