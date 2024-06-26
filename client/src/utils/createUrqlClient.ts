import {
  Cache,
  cacheExchange,
  QueryInput,
  Resolver,
} from "@urql/exchange-graphcache";
import Router from "next/router";
import { dedupExchange, Exchange, fetchExchange } from "urql";
import { pipe, tap } from "wonka";
import {
  DeletePostMutationVariables,
  LoginMutation,
  LogoutMutation,
  MeDocument,
  MeQuery,
  RegisterMutation,
  VoteMutationVariables,
} from "../generated/graphql";
import { gql } from "@urql/core";

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
  // (parent, fieldArgs, cache, info) => {}
  return (_parent, fieldArgs, cache, info) => {
    const { parentKey: entityKey, fieldName } = info;

    // console.log(entityKey, fieldName);
    // Query posts

    // this cache.inspectFields() will get all the field in the cache under this entityKey which has value of Query
    const allFields = cache.inspectFields(entityKey);

    // console.log("allFields:", allFields);
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
    // console.log("FieldInfos:", fieldInfos);

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

    // using this line check if the next page is in the cache. If not fetch the next page from the server.
    const isInTheCache = cache.resolve(
      cache.resolve({ __typename: "Query" }, "posts", fieldArgs) as string,
      "posts"
    );
    info.partial = !isInTheCache;

    // Check if posts in the cache and return that from the cache
    // As there will be more query executed, more posts will be there, and we will add them all to results and return to user.
    // We are gathering 1st page, 2nd page, 3rd page all together to a long list
    const results: string[] = [];
    let hasMore = true;
    fieldInfos.forEach((fieldInfo) => {
      const key = cache.resolve(
        { __typename: "Query" },
        "posts",
        fieldInfo.arguments
      ) as string;
      const data = cache.resolve(key, "posts") as string[];
      const _hasMore = cache.resolve(key, "hasMore") as boolean;
      // we look for all the paginatedPosts that we fetched in cache and if one of them has hasMore = false, then that means no more posts to fetch in DB
      if (!_hasMore) {
        hasMore = _hasMore;
      }
      // console.log("data and hasMore: ", data, hasMore);
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
      // true
      results.push(...data);
    });

    return {
      __typename: "PaginatedPosts",
      hasMore,
      posts: results,
    };
  };
};

function invalidateAllPosts(cache: Cache) {
  // You can see the changes in list of query with this log
  // console.log(cache.inspectFields("Query"));

  const allFields = cache.inspectFields("Query");
  const fieldInfos = allFields.filter((info) => info.fieldName === "posts");
  fieldInfos.forEach((fieldInfo) => {
    cache.invalidate("Query", "posts", fieldInfo.arguments || {});
  });
}

// https://formidable.com/open-source/urql/docs/advanced/server-side-rendering/#legacy-nextjs-pages
// we can wrap components with this and this will optionally server side render pages
// we get to choose which pages to be server side rendered

// https://github.com/urql-graphql/urql/discussions/1260
// How to pass cookie to the Next.js server
// urql is passing us the context object (ctx)
export const createUrqlClient = (ssrExchange: any, ctx: any) => {
  let cookie = "";
  // note that ctx is only available in the server, but this code is running both in browser and server. So check if it is server.
  if (typeof window === "undefined") {
    // console.log(ctx.req.headers.cookie);
    cookie = ctx?.req?.headers?.cookie;
  }
  return {
    // client is my graphQL server
    url: process.env.NEXT_PUBLIC_API_URL as string,
    fetchOptions: {
      credentials: "include" as const, // send a cookie
      headers: cookie
        ? {
            cookie,
          }
        : undefined,
    },
    // The Graphcache package exports the cacheExchange which replaces the default cacheExchange in @urql/core.
    // The code snippet is from urql > graphcache > cache update
    exchanges: [
      dedupExchange,
      cacheExchange({
        // PaginationPosts is the type we created but it does not have id field, so we need to say that it doesn't have id
        keys: {
          PaginatedPosts: () => null,
        },
        // This is a client side resolver that will run every time the query for posts runs and it will alter how query result looks
        resolvers: {
          Query: {
            posts: cursorPagination(),
          },
        },
        updates: {
          Mutation: {
            // this is the function that we can do to update cache
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
              invalidateAllPosts(cache);
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
            createPost: (_result, _args, cache, _info) => {
              // createPost is adding a new post in the DB. In the client side (here) we are removing this cache to make refetch this data from the server.
              // But the problem is that we have the long list of paginationedPosts, so we need to invalidate all of them.
              // So when we are redirected to the main page after creating a post, new post will be there.
              invalidateAllPosts(cache);
            },
            vote: (_result, args, cache, _info) => {
              // URQL, Read fragment
              // https://formidable.com/open-source/urql/docs/api/graphcache/#readfragment
              const { postId, value } = args as VoteMutationVariables;
              const data = cache.readFragment(
                gql`
                  fragment _ on Post {
                    id
                    points
                    voteStatus
                  }
                `,
                { id: postId }
              );
              if (data) {
                // if the user try to down vote or up vote again, don't do anything
                if (data.voteStatus === value) {
                  return;
                }
                // !data.voteStatus ? 1 : 2  => if user try to change their vote, mutiply to value by 2
                // because when user try to change up vote to down vote, we need to remove up vote and add down vote so need to do -2
                const newPoints =
                  (data.points as number) + (!data.voteStatus ? 1 : 2) * value;
                // URQL, Write fragment
                // https://formidable.com/open-source/urql/docs/api/graphcache/#writefragment
                cache.writeFragment(
                  gql`
                    fragment __ on Post {
                      points
                      voteStatus
                    }
                  `,
                  { id: postId, points: newPoints, voteStatus: value }
                );
              }
            },
            deletePost: (_result, args, cache, _info) => {
              // Cache.invalidate makes the specified post to null
              cache.invalidate({
                __typename: "Post",
                id: (args as DeletePostMutationVariables).id,
              });
            },
          },
        },
      }),
      errorExchange,
      ssrExchange,
      fetchExchange,
    ],
  };
};

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
