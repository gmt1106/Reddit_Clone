import gql from "graphql-tag";
import * as Urql from "urql";
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = {
  [K in keyof T]: T[K];
};
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & {
  [SubKey in K]?: Maybe<T[SubKey]>;
};
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & {
  [SubKey in K]: Maybe<T[SubKey]>;
};
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
};

export type FieldError = {
  __typename?: "FieldError";
  field: Scalars["String"];
  message: Scalars["String"];
};

export type Mutation = {
  __typename?: "Mutation";
  changePassword: UserResponse;
  createPost: Post;
  deletePost: Scalars["Boolean"];
  forgotPassword: Scalars["Boolean"];
  login: UserResponse;
  logout: Scalars["Boolean"];
  register: UserResponse;
  updatePost?: Maybe<Post>;
  vote: Scalars["Boolean"];
};

export type MutationChangePasswordArgs = {
  newPassword: Scalars["String"];
  token: Scalars["String"];
};

export type MutationCreatePostArgs = {
  createPostInput: CreatePostInput;
};

export type MutationDeletePostArgs = {
  id: Scalars["Int"];
};

export type MutationForgotPasswordArgs = {
  email: Scalars["String"];
};

export type MutationLoginArgs = {
  password: Scalars["String"];
  usernameOrEmail: Scalars["String"];
};

export type MutationRegisterArgs = {
  registerInput: RegisterInput;
};

export type MutationUpdatePostArgs = {
  id: Scalars["Int"];
  text: Scalars["String"];
  title: Scalars["String"];
};

export type MutationVoteArgs = {
  postId: Scalars["Int"];
  value: Scalars["Int"];
};

export type PaginatedPosts = {
  __typename?: "PaginatedPosts";
  hasMore: Scalars["Boolean"];
  posts: Array<Post>;
};

export type Post = {
  __typename?: "Post";
  createdAt: Scalars["String"];
  creator: User;
  creatorId: Scalars["Float"];
  id: Scalars["Float"];
  points: Scalars["Float"];
  text: Scalars["String"];
  textSnippet: Scalars["String"];
  title: Scalars["String"];
  updatedAt: Scalars["String"];
  voteStatus?: Maybe<Scalars["Int"]>;
};

export type Query = {
  __typename?: "Query";
  hello: Scalars["String"];
  me?: Maybe<User>;
  post?: Maybe<Post>;
  posts: PaginatedPosts;
};

export type QueryPostArgs = {
  id: Scalars["Int"];
};

export type QueryPostsArgs = {
  cursor?: InputMaybe<Scalars["String"]>;
  limit: Scalars["Int"];
};

export type RegisterInput = {
  email: Scalars["String"];
  password: Scalars["String"];
  username: Scalars["String"];
};

export type User = {
  __typename?: "User";
  createdAt: Scalars["String"];
  email: Scalars["String"];
  id: Scalars["Float"];
  updatedAt: Scalars["String"];
  username: Scalars["String"];
};

export type UserResponse = {
  __typename?: "UserResponse";
  errors?: Maybe<Array<FieldError>>;
  user?: Maybe<User>;
};

export type CreatePostInput = {
  text: Scalars["String"];
  title: Scalars["String"];
};

export type ErrorFragment = {
  __typename?: "FieldError";
  field: string;
  message: string;
};

export type PostSnippetFragment = {
  __typename?: "Post";
  id: number;
  title: string;
  textSnippet: string;
  creatorId: number;
  points: number;
  createdAt: string;
  updatedAt: string;
  voteStatus?: number | null;
  creator: { __typename?: "User"; id: number; username: string };
};

export type UserInfoFragment = {
  __typename?: "User";
  id: number;
  username: string;
};

export type UserResponseFragment = {
  __typename?: "UserResponse";
  errors?: Array<{
    __typename?: "FieldError";
    field: string;
    message: string;
  }> | null;
  user?: { __typename?: "User"; id: number; username: string } | null;
};

export type ChangePasswordMutationVariables = Exact<{
  newPassword: Scalars["String"];
  token: Scalars["String"];
}>;

export type ChangePasswordMutation = {
  __typename?: "Mutation";
  changePassword: {
    __typename?: "UserResponse";
    errors?: Array<{
      __typename?: "FieldError";
      field: string;
      message: string;
    }> | null;
    user?: { __typename?: "User"; id: number; username: string } | null;
  };
};

export type CreatePostMutationVariables = Exact<{
  createPostInput: CreatePostInput;
}>;

export type CreatePostMutation = {
  __typename?: "Mutation";
  createPost: {
    __typename?: "Post";
    id: number;
    title: string;
    text: string;
    points: number;
    creatorId: number;
    createdAt: string;
    updatedAt: string;
  };
};

export type DeletePostMutationVariables = Exact<{
  id: Scalars["Int"];
}>;

export type DeletePostMutation = {
  __typename?: "Mutation";
  deletePost: boolean;
};

export type ForgotPasswordMutationVariables = Exact<{
  email: Scalars["String"];
}>;

export type ForgotPasswordMutation = {
  __typename?: "Mutation";
  forgotPassword: boolean;
};

export type LoginMutationVariables = Exact<{
  usernameOrEmail: Scalars["String"];
  password: Scalars["String"];
}>;

export type LoginMutation = {
  __typename?: "Mutation";
  login: {
    __typename?: "UserResponse";
    errors?: Array<{
      __typename?: "FieldError";
      field: string;
      message: string;
    }> | null;
    user?: { __typename?: "User"; id: number; username: string } | null;
  };
};

export type LogoutMutationVariables = Exact<{ [key: string]: never }>;

export type LogoutMutation = { __typename?: "Mutation"; logout: boolean };

export type RegisterMutationVariables = Exact<{
  registerInput: RegisterInput;
}>;

export type RegisterMutation = {
  __typename?: "Mutation";
  register: {
    __typename?: "UserResponse";
    errors?: Array<{
      __typename?: "FieldError";
      field: string;
      message: string;
    }> | null;
    user?: { __typename?: "User"; id: number; username: string } | null;
  };
};

export type UpdatePostMutationVariables = Exact<{
  text: Scalars["String"];
  title: Scalars["String"];
  id: Scalars["Int"];
}>;

export type UpdatePostMutation = {
  __typename?: "Mutation";
  updatePost?: {
    __typename?: "Post";
    id: number;
    title: string;
    text: string;
    textSnippet: string;
  } | null;
};

export type VoteMutationVariables = Exact<{
  value: Scalars["Int"];
  postId: Scalars["Int"];
}>;

export type VoteMutation = { __typename?: "Mutation"; vote: boolean };

export type MeQueryVariables = Exact<{ [key: string]: never }>;

export type MeQuery = {
  __typename?: "Query";
  me?: { __typename?: "User"; id: number; username: string } | null;
};

export type PostQueryVariables = Exact<{
  postId: Scalars["Int"];
}>;

export type PostQuery = {
  __typename?: "Query";
  post?: {
    __typename?: "Post";
    id: number;
    title: string;
    text: string;
    creatorId: number;
    points: number;
    createdAt: string;
    updatedAt: string;
    voteStatus?: number | null;
    creator: { __typename?: "User"; id: number; username: string };
  } | null;
};

export type PostsQueryVariables = Exact<{
  limit: Scalars["Int"];
  cursor?: InputMaybe<Scalars["String"]>;
}>;

export type PostsQuery = {
  __typename?: "Query";
  posts: {
    __typename?: "PaginatedPosts";
    hasMore: boolean;
    posts: Array<{
      __typename?: "Post";
      id: number;
      title: string;
      textSnippet: string;
      creatorId: number;
      points: number;
      createdAt: string;
      updatedAt: string;
      voteStatus?: number | null;
      creator: { __typename?: "User"; id: number; username: string };
    }>;
  };
};

export const PostSnippetFragmentDoc = gql`
  fragment PostSnippet on Post {
    id
    title
    textSnippet
    creatorId
    points
    createdAt
    updatedAt
    voteStatus
    creator {
      id
      username
    }
  }
`;
export const ErrorFragmentDoc = gql`
  fragment Error on FieldError {
    field
    message
  }
`;
export const UserInfoFragmentDoc = gql`
  fragment UserInfo on User {
    id
    username
  }
`;
export const UserResponseFragmentDoc = gql`
  fragment UserResponse on UserResponse {
    errors {
      ...Error
    }
    user {
      ...UserInfo
    }
  }
  ${ErrorFragmentDoc}
  ${UserInfoFragmentDoc}
`;
export const ChangePasswordDocument = gql`
  mutation changePassword($newPassword: String!, $token: String!) {
    changePassword(newPassword: $newPassword, token: $token) {
      ...UserResponse
    }
  }
  ${UserResponseFragmentDoc}
`;

export function useChangePasswordMutation() {
  return Urql.useMutation<
    ChangePasswordMutation,
    ChangePasswordMutationVariables
  >(ChangePasswordDocument);
}
export const CreatePostDocument = gql`
  mutation CreatePost($createPostInput: createPostInput!) {
    createPost(createPostInput: $createPostInput) {
      id
      title
      text
      points
      creatorId
      createdAt
      updatedAt
    }
  }
`;

export function useCreatePostMutation() {
  return Urql.useMutation<CreatePostMutation, CreatePostMutationVariables>(
    CreatePostDocument
  );
}
export const DeletePostDocument = gql`
  mutation DeletePost($id: Int!) {
    deletePost(id: $id)
  }
`;

export function useDeletePostMutation() {
  return Urql.useMutation<DeletePostMutation, DeletePostMutationVariables>(
    DeletePostDocument
  );
}
export const ForgotPasswordDocument = gql`
  mutation ForgotPassword($email: String!) {
    forgotPassword(email: $email)
  }
`;

export function useForgotPasswordMutation() {
  return Urql.useMutation<
    ForgotPasswordMutation,
    ForgotPasswordMutationVariables
  >(ForgotPasswordDocument);
}
export const LoginDocument = gql`
  mutation Login($usernameOrEmail: String!, $password: String!) {
    login(usernameOrEmail: $usernameOrEmail, password: $password) {
      ...UserResponse
    }
  }
  ${UserResponseFragmentDoc}
`;

export function useLoginMutation() {
  return Urql.useMutation<LoginMutation, LoginMutationVariables>(LoginDocument);
}
export const LogoutDocument = gql`
  mutation Logout {
    logout
  }
`;

export function useLogoutMutation() {
  return Urql.useMutation<LogoutMutation, LogoutMutationVariables>(
    LogoutDocument
  );
}
export const RegisterDocument = gql`
  mutation Register($registerInput: RegisterInput!) {
    register(registerInput: $registerInput) {
      ...UserResponse
    }
  }
  ${UserResponseFragmentDoc}
`;

export function useRegisterMutation() {
  return Urql.useMutation<RegisterMutation, RegisterMutationVariables>(
    RegisterDocument
  );
}
export const UpdatePostDocument = gql`
  mutation UpdatePost($text: String!, $title: String!, $id: Int!) {
    updatePost(text: $text, title: $title, id: $id) {
      id
      title
      text
      textSnippet
    }
  }
`;

export function useUpdatePostMutation() {
  return Urql.useMutation<UpdatePostMutation, UpdatePostMutationVariables>(
    UpdatePostDocument
  );
}
export const VoteDocument = gql`
  mutation Vote($value: Int!, $postId: Int!) {
    vote(value: $value, postId: $postId)
  }
`;

export function useVoteMutation() {
  return Urql.useMutation<VoteMutation, VoteMutationVariables>(VoteDocument);
}
export const MeDocument = gql`
  query Me {
    me {
      ...UserInfo
    }
  }
  ${UserInfoFragmentDoc}
`;

export function useMeQuery(
  options?: Omit<Urql.UseQueryArgs<MeQueryVariables>, "query">
) {
  return Urql.useQuery<MeQuery>({ query: MeDocument, ...options });
}
export const PostDocument = gql`
  query Post($postId: Int!) {
    post(id: $postId) {
      id
      title
      text
      creatorId
      points
      createdAt
      updatedAt
      voteStatus
      creator {
        id
        username
      }
    }
  }
`;

export function usePostQuery(
  options: Omit<Urql.UseQueryArgs<PostQueryVariables>, "query">
) {
  return Urql.useQuery<PostQuery>({ query: PostDocument, ...options });
}
export const PostsDocument = gql`
  query Posts($limit: Int!, $cursor: String) {
    posts(limit: $limit, cursor: $cursor) {
      posts {
        ...PostSnippet
      }
      hasMore
    }
  }
  ${PostSnippetFragmentDoc}
`;

export function usePostsQuery(
  options: Omit<Urql.UseQueryArgs<PostsQueryVariables>, "query">
) {
  return Urql.useQuery<PostsQuery>({ query: PostsDocument, ...options });
}
