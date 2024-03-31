import { ApolloCache, gql } from "@apollo/client";
import { ChevronDownIcon, ChevronUpIcon } from "@chakra-ui/icons";
import { Flex, IconButton } from "@chakra-ui/react";
import React, { useState } from "react";
import {
  PostSnippetFragment,
  useVoteMutation,
  VoteMutation,
} from "../generated/graphql";

interface UpvoteSectionProps {
  post: PostSnippetFragment;
}

// update cache after mutation using update function.
const cacheUpdateAfterVote = (
  value: number,
  postId: number,
  cache: ApolloCache<VoteMutation>
) => {
  // put type definition as PostSnippetFragment
  const data = cache.readFragment<PostSnippetFragment>({
    id: "Post:" + postId,
    fragment: gql`
      fragment _ on Post {
        id
        points
        voteStatus
      }
    `,
  });
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
    cache.writeFragment({
      id: "Post:" + postId,
      fragment: gql`
        fragment __ on Post {
          points
          voteStatus
        }
      `,
      data: { id: postId, points: newPoints, voteStatus: value },
    });
  }
};

export const UpvoteSection: React.FC<UpvoteSectionProps> = ({ post }) => {
  const [loadingState, setLoadingState] = useState<
    "upvote-loading" | "downvote-loading" | "not-loading"
  >("not-loading");
  // The reason we are not using fetching for loading state is because we don' know if up voate is loadng or down vote is loading
  // That is why we made separate useState above
  const [vote] = useVoteMutation();
  return (
    <Flex direction="column" justifyContent="center" alignItems="center" mr={4}>
      <IconButton
        onClick={async () => {
          setLoadingState("upvote-loading");
          await vote({
            variables: { postId: post.id, value: 1 },
            update: (cache) => cacheUpdateAfterVote(1, post.id, cache),
          });
          setLoadingState("not-loading");
        }}
        colorScheme={post.voteStatus === 1 ? "green" : undefined}
        isLoading={loadingState === "upvote-loading"}
        aria-label="Up vote post"
        icon={<ChevronUpIcon />}
      />
      {post.points}
      <IconButton
        onClick={async () => {
          setLoadingState("downvote-loading");
          await vote({
            variables: { postId: post.id, value: -1 },
            update: (cache) => cacheUpdateAfterVote(-1, post.id, cache),
          });
          setLoadingState("not-loading");
        }}
        colorScheme={post.voteStatus === -1 ? "red" : undefined}
        isLoading={loadingState === "downvote-loading"}
        aria-label="Down vote post"
        icon={<ChevronDownIcon />}
      />
    </Flex>
  );
};
