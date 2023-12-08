import { Box, Heading } from "@chakra-ui/react";
import { withUrqlClient } from "next-urql";
import { useRouter } from "next/router";
import { Layout } from "../../components/Layout";
import { usePostQuery } from "../../generated/graphql";
import { createUrqlClient } from "../../utils/createUrqlClient";

export const Post = ({}) => {
  const router = useRouter();
  const intId =
    typeof router.query.id === "string" ? parseInt(router.query.id) : -1;
  const [{ data, error, fetching }] = usePostQuery({
    pause: intId === -1, // Since there isn't any post with id = -1, if we get -1 as a postId, then don't send request to server.
    variables: {
      postId: intId,
    },
  });
  if (fetching) {
    return <Layout>loading...</Layout>;
  }
  if (error) {
    return <Box>{error.message}</Box>;
  }
  // This is the case when we are done fetching and didn't get error, but just got null post because we were not able to find a post with that id
  if (!data?.post) {
    return (
      <Layout>
        <Box>Could not find the post.</Box>
      </Layout>
    );
  }
  return (
    <Layout>
      <Heading mb={4}>{data?.post?.title}</Heading>
      {data?.post?.text}
    </Layout>
  );
};

// We want good SEO for post conents
export default withUrqlClient(createUrqlClient, { ssr: true })(Post);
