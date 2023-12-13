import { Box, Heading } from "@chakra-ui/react";
import { withUrqlClient } from "next-urql";
import { Layout } from "../../components/Layout";
import { createUrqlClient } from "../../utils/createUrqlClient";
import { useGetPostFromUrl } from "../../utils/useGetPostFromUrl";

export const Post = ({}) => {
  const [{ data, error, fetching }] = useGetPostFromUrl();
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
