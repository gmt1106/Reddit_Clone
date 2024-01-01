import { Box, Flex, Heading } from "@chakra-ui/react";
import { withUrqlClient } from "next-urql";
import { EditDeletePostButtons } from "../../components/EditDeletePostButtons";
import { Layout } from "../../components/Layout";
import { UpvoteSection } from "../../components/UpvoteSection";
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
      <Flex align="center">
        <Box>
          <UpvoteSection post={{ textSnippet: "", ...data?.post }} />
        </Box>
        <Box>
          <Heading mb={4}>{data?.post?.title}</Heading>
          <Box mb={4}> {data?.post?.text}</Box>
          <EditDeletePostButtons
            id={data?.post?.id}
            creatorId={data?.post?.creatorId}
          />
        </Box>
      </Flex>
    </Layout>
  );
};

// We want good SEO for post conents
export default withUrqlClient(createUrqlClient, { ssr: true })(Post);
