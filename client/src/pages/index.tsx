import { NavBar } from "../components/NavBar";
import { withUrqlClient } from "next-urql";
import { createUrqlClient } from "../utils/createUrqlClient";
import { usePostsQuery } from "../generated/graphql";

const Index = () => {
  const [{ data }] = usePostsQuery();
  return (
    <>
      <NavBar />
      {!data ? (
        <div>loading...</div>
      ) : (
        data.posts.map((post) => <div key={post.id}>{post.title}</div>)
      )}
    </>
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
// When SSR is off, you see "loading..." on the screen and then after a while, posts are displayed
// Javascript is evaluated and then fetch the posts data and change it to HTML
// This is the worst for the Search Engine Optimization (SEO) which means won't appear in google search
// When SSR is on, you see posts being displayed withouht "loading..." message
//
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
