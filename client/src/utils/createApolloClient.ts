// code source: https://www.npmjs.com/package/next-apollo
// rename import
import { ApolloClient, createHttpLink, InMemoryCache } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { withApollo as createWithApollo } from "next-apollo";
import { PaginatedPosts } from "../generated/graphql";
import { NextPageContext } from "next";

const httpLink = createHttpLink({
  // uri and credentials are all match with the createUrqlClient
  uri: process.env.NEXT_PUBLIC_API_URL as string,
  // set to include if your backend is a different domain
  credentials: "include",
});

// ssr cookie forwarding
const authLink = setContext((_, { headers }) => {
  // get the authentication token from local storage if it exists
  const token = localStorage.getItem("token");
  // return the headers to the context so httpLink can read them
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    },
  };
});

const createClient = (ctx: NextPageContext) =>
  new ApolloClient({
    link: authLink.concat(httpLink),
    // ****** This is how to set up cache instead of deprecated updateQuery in index.tsx ******
    // source: https://www.apollographql.com/docs/react/caching/cache-field-behavior#the-merge-function
    cache: new InMemoryCache({
      typePolicies: {
        Query: {
          // "Query" and "posts" is from the posts.graphql structure
          fields: {
            posts: {
              // Without this, apollo client will save incoming data at different place with different variables: {limit: 15, cursor: ...} as a key.
              // So we need to tell apollo client that we don't care about the variables, we just want to concatenate them. We do this with keyArgs.
              // With this we specify which arguments are important (are used for filter), so we won't put 'limit' and 'cursor' here because they are just for pagination.
              // Basically join lists together based on what the arguments values are.
              keyArgs: [],
              // The return type of the posts query is PaginatedPosts. We defined it that way in the server resolver.
              // existing can be undefined if there is nothing in the cache
              merge(
                existing: PaginatedPosts | undefined,
                incoming: PaginatedPosts
              ): PaginatedPosts {
                // instruction on how to merge
                return {
                  // keep the incoming value and only update posts
                  ...incoming,
                  posts: [...(existing?.posts || []), ...incoming.posts],
                };
              },
            },
          },
        },
      },
    }),
  });

export const withApollo = createWithApollo(createClient);
