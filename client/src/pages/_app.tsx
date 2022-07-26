import { ChakraProvider } from "@chakra-ui/react";
import { createClient, dedupExchange, fetchExchange, Provider } from "urql";
import theme from "../theme";
import { AppProps } from "next/app";
import { cacheExchange, Cache, QueryInput } from "@urql/exchange-graphcache";
import {
  MeDocument,
  LoginMutation,
  RegisterMutation,
  MeQuery,
} from "../generated/graphql";

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

// client is my graphQL server
const client = createClient({
  url: "http://localhost:4000/graphql",
  fetchOptions: {
    credentials: "include", // send a cookie
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
        },
      },
    }),
    fetchExchange,
  ],
});

// cover the app with urql provider
function MyApp({ Component, pageProps }: AppProps) {
  return (
    <Provider value={client}>
      <ChakraProvider resetCSS theme={theme}>
        <Component {...pageProps} />
      </ChakraProvider>
    </Provider>
  );
}

export default MyApp;
