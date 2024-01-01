import { Box, Button, Flex, Heading, Stack, Text } from "@chakra-ui/react";
import { withUrqlClient } from "next-urql";
import NextLink from "next/link";
import { useState } from "react";
import { EditDeletePostButtons } from "../components/EditDeletePostButtons";
import { Layout } from "../components/Layout";
import { UpvoteSection } from "../components/UpvoteSection";
import { PAGINATION_LIMIT } from "../constants";
import { useMeQuery, usePostsQuery } from "../generated/graphql";
import { createUrqlClient } from "../utils/createUrqlClient";

const Index = () => {
  // This is to support pagination. Using setVariables() get the next page.
  const [variables, setVariables] = useState({
    limit: PAGINATION_LIMIT,
    cursor: null as null | string,
  });

  // console.log(variables);
  // {limit: 10, cursor: null}

  // Data will be null by default and fetching will be true. Then we will show loading...
  // We want load more button only when we have data.
  const [{ data, error, fetching }] = usePostsQuery({
    variables,
  });

  const [{ data: userData }] = useMeQuery();

  // if (!fetching && !data) {
  //   return (
  //     <div>
  //       <div> you got query failed for some reason</div>
  //       <div>{error?.message}</div>
  //     </div>
  //   );
  // }
  console.log("userDate: ", userData?.me);

  return (
    <Layout>
      {!userData?.me ? (
        <>
          <Text fontSize="4xl">Welcome to Reddit Clone!</Text>
          <Text fontSize="2xl">
            Please log in to see other's posts and create your posts. If you are
            not a user yet, you can register with an email address.
          </Text>
        </>
      ) : (
        <>
          {!data ? (
            fetching ? (
              <Text>loading...</Text>
            ) : (
              <>
                <div>
                  <Text> you got query failed for some reason</Text>
                </div>
                {console.log(error?.message)}
              </>
            )
          ) : (
            <Stack>
              {
                // after doing post delete cache update, there will be some posts that are null
                data!.posts.posts.map((post) =>
                  !post ? null : (
                    <Flex key={post.id} p={5} shadow="md" borderWidth="1px">
                      <UpvoteSection post={post} />
                      <Box flex={1}>
                        {/* Linking to dynamic path: https://nextjs.org/docs/pages/building-your-application/routing/linking-and-navigating#linking-to-dynamic-paths */}
                        <NextLink href={`/post/${encodeURIComponent(post.id)}`}>
                          <Heading fontSize="xl">{post.title}</Heading>
                        </NextLink>
                        <Text>Posted by {post.creator.username}</Text>
                        <Flex align="center">
                          <Text flex={1} mt={4}>
                            {post.textSnippet}
                          </Text>
                          <Box mt="auto">
                            <EditDeletePostButtons
                              id={post.id}
                              creatorId={post.creatorId}
                            />
                          </Box>
                        </Flex>
                      </Box>
                    </Flex>
                  )
                )
              }
            </Stack>
          )}
          {data && data.posts.hasMore ? (
            <Flex>
              <Button
                onClick={() => {
                  setVariables({
                    limit: variables.limit, // keep the same limit
                    cursor:
                      data.posts.posts[data.posts.posts.length - 1].createdAt, // the createdAt field of the last element in the posts
                  });
                }}
                isLoading={fetching}
                m="auto"
                my={8}
              >
                Load more
              </Button>
            </Flex>
          ) : null}
        </>
      )}
    </Layout>
  );
};

// Server-Side Rendering (SSR) with URQL and Next.js
// SSR is on when {ssr: true} is included
// https://formidable.com/open-source/urql/docs/advanced/server-side-rendering/
export default withUrqlClient(createUrqlClient, { ssr: true })(Index);

// To see the difference between the SSR being on and being off
// 1. Make this homepage to fetch posts
// const [{ data }] = usePostsQuery();
// {
//   !data ? (
//     <div>loading...</div>
//   ) : (
//     data.posts.map((post) => <div key={post.id}>{post.title}</div>)
//   );
// }
// 2. Put delay in post qeury in post resolver (post.ts)
// sleep function:
// const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
// 3. In the chrome browser, open inspect, go to Network and set Fast 3G
//
// When SSR is off, you see "loading..." on the screen and then after a while, posts are displayed.
// This is because the page source does not have the data, but it has <div> loading... </div>.
// (You can check the page source by right click > View Page Source)
// What happen is that Javascript is evaluated and then fetch the posts data and change it to HTML from the page source.
// This is the worst for the Search Engine Optimization (SEO) which means won't appear in google search
// Because based on the page source contents Google decides which links to display for a search
// When SSR is on, you see posts being displayed without "loading..." message in the page source
//
// If you want to, you can load all pages from server, but that is more load on server.
// So the data I am using need to be found by Google, then use server side rendering.
//
// When should I use SSR?
// If I am querying data (dynamic data) and if the content of the query needs to be found by google (= good SEO),
// then use SSR to query the data.
// For example, this homepage that displays posts is searchable in google.
// However, the log in page does not have any information. There are only static data.
// Also if the page that is displayed is specific to the user (if you need login to access the data), don't do SSR.
//
//
// The process of SSR
// 1. I make a request to the browser
// 2. The browser makes a request to the next.js server (http://localhost:3000)
// 3. The next.js server makes a request to the graphql server (http://localhost:4000) to send posts
// 4. The graphql server builds the HTML file and sends back
//
//
// A thing about the next.js is that after you load a single page, the page after that is not server side rendered.
//
