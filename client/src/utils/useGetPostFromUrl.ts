import { usePostQuery } from "../generated/graphql";
import { useGetIntPostIdFromUrl } from "./useGetIntPostIdFromUrl";

export const useGetPostFromUrl = () => {
  const intId = useGetIntPostIdFromUrl();
  return usePostQuery({
    pause: intId === -1, // Since there isn't any post with id = -1, if we get -1 as a postId, then don't send request to server.
    variables: {
      postId: intId,
    },
  });
};
