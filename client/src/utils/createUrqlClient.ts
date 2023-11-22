import {
  Cache,
  cacheExchange,
  QueryInput,
  Resolver,
} from "@urql/exchange-graphcache";
import Router from "next/router";
import {
  dedupExchange,
  Exchange,
  fetchExchange,
  stringifyVariables,
} from "urql";
import { pipe, tap } from "wonka";
import {
  LoginMutation,
  LogoutMutation,
  MeDocument,
  MeQuery,
  RegisterMutation,
} from "../generated/graphql";

// Global Error Handling
// This will allow us to catch all errors. A way to deal with general error.
export const errorExchange: Exchange =
  ({ forward }) =>
  (ops$) => {
    return pipe(
      forward(ops$),
      // every thime there is an error, it will come here
      tap(({ error }) => {
        if (error?.message.includes("not authorized")) {
          // outside of react so use global router instead of using hook.
          // replce() = replace the current route. Used when you want to redirect.
          // push() = push on a new entry on the stack.
          Router.replace("/login");
        }
      })
    );
  };

// Urql has simplePagination() and relayPagination() which will handle the underlying detail
// The problem is simplePagination only works with offset and limit but we are using cursor and limit
// So we will alter the simplePagination code from Urql
export const cursorPagination = (): Resolver<any, any, any> => {
  // This is the shape of the client side resolver
  // (_parent, fieldArgs, cache, info) => {}
  return (_parent, fieldArgs, cache, info) => {
    const { parentKey: entityKey, fieldName } = info;

    // console.log(entityKey, fieldName);
    // Query posts

    // this cache.inspectFields() will get all the field in the cache under this entityKey which has value of Query
    const allFields = cache.inspectFields(entityKey);

    // console.log(allFields);
    // [
    //   {
    //     fieldKey: 'posts({"limit":10})',
    //     fieldName: "posts",
    //     arguments: { limit: 10 },
    //   },
    // ];

    // With value from cache, what can do is we can filter the one that we don't want
    // This line is filtering out only posts value from cache
    const fieldInfos = allFields.filter((info) => info.fieldName === fieldName);

    // We will return undefined if there is no data. First one won't have data and that is called cache miss.
    const size = fieldInfos.length;
    if (size === 0) {
      return undefined;
    }

    // fieldArgs is the variables that we passed from the index.tsx.
    // console.log("fieldArgs", fieldArgs);
    // {limit: 10}
    // {limit: 10, cursor: '1700116070550'}

    // If we pass this,
    // info.partial = true;
    // urql will know that we didn't get all data and will fetch more data from server
    // we set this to true if the next page is not in the cache

    // we need to create the fieldKey manually
    const fieldKey = `${fieldName}(${stringifyVariables(fieldArgs)})`;
    // console.log("fieldKey by me ", fieldKey);
    // posts({"cursor":"1700116070550","limit":10})

    // using this line check if the next page is in the cache. If not fetch the next page from the server.
    const isInTheCache = cache.resolve(entityKey, fieldKey);
    info.partial = !isInTheCache;

    // Check if posts in the cache and return that from the cache
    // As there will be more query executed, more posts will be there, and we will add them all to results and return to user.
    // We are gathering 1st page, 2nd page, 3rd page all together to a long list
    const results: string[] = [];
    fieldInfos.forEach((fieldInfo) => {
      const data = cache.resolve(entityKey, fieldInfo.fieldKey) as string[];
      // console.log(data);
      // [
      //   "Post:13",
      //   "Post:14",
      //   "Post:6",
      //   "Post:7",
      //   "Post:8",
      //   "Post:9",
      //   "Post:10",
      //   "Post:11",
      //   "Post:12",
      //   "Post:15",
      // ];
      //
      results.push(...data);
    });

    return results;

    // const visited = new Set();
    // let result: NullArray<string> = [];
    // let prevOffset: number | null = null;

    // for (let i = 0; i < size; i++) {
    //   const { fieldKey, arguments: args } = fieldInfos[i];
    //   if (args === null || !compareArgs(fieldArgs, args)) {
    //     continue;
    //   }

    //   const links = cache.resolve(entityKey, fieldKey) as string[];
    //   const currentOffset = args[cursorArgument];

    //   if (
    //     links === null ||
    //     links.length === 0 ||
    //     typeof currentOffset !== "number"
    //   ) {
    //     continue;
    //   }

    //   const tempResult: NullArray<string> = [];

    //   for (let j = 0; j < links.length; j++) {
    //     const link = links[j];
    //     if (visited.has(link)) continue;
    //     tempResult.push(link);
    //     visited.add(link);
    //   }

    //   if (
    //     (!prevOffset || currentOffset > prevOffset) ===
    //     (mergeMode === "after")
    //   ) {
    //     result = [...result, ...tempResult];
    //   } else {
    //     result = [...tempResult, ...result];
    //   }

    //   prevOffset = currentOffset;
    // }

    // const hasCurrentPage = cache.resolve(entityKey, fieldName, fieldArgs);
    // if (hasCurrentPage) {
    //   return result;
    // } else if (!(info as any).store.schema) {
    //   return undefined;
    // } else {
    //   info.partial = true;
    //   return result;
    // }
  };
};

// https://formidable.com/open-source/urql/docs/advanced/server-side-rendering/#legacy-nextjs-pages
// we can wrap components with this and this will optionally server side render pages
// we get to choose which pages to be server side rendered
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
      // This is a client side resolver that will run every time the query runs and it will alter how query result looks
      resolvers: {
        Query: {
          posts: cursorPagination(),
        },
      },
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
            // We don't need to invalidate the user, because we are not deleting the user but just logging him out
            // Therefore we want the me query to return null, so we should update me query to return null
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
