import React from "react";
import { DeleteIcon, EditIcon } from "@chakra-ui/icons";
import { Box } from "@chakra-ui/react";
import NextLink from "next/link";
import { useDeletePostMutation, useMeQuery } from "../generated/graphql";

interface EditDeletePostButtonsProps {
  id: number;
  creatorId: number;
}

export const EditDeletePostButtons: React.FC<EditDeletePostButtonsProps> = ({
  id,
  creatorId,
}) => {
  // fetch logged in user to disable delete and edit buttons
  const { data: loggedInUserData } = useMeQuery();
  const [deletePost] = useDeletePostMutation();

  if (loggedInUserData?.me?.id !== creatorId) {
    return null;
  }
  return (
    <Box>
      <NextLink href={"/post/edit/[id]"} as={`/post/edit/${id}`}>
        <EditIcon mr={4} aria-label="Edit Post" />
      </NextLink>
      <DeleteIcon
        aria-label="Delete Post"
        onClick={() => {
          deletePost({
            variables: { id: id },
            // update cache after mutation using update function.
            update: (cache) => {
              // evict() is the same as urql invalidate(). It makes the specified post to null.
              cache.evict({ id: "Post:" + id });
            },
          });
        }}
      />
    </Box>
  );
};
