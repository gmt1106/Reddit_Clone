import { Box, Flex, Button, Heading } from "@chakra-ui/react";
import React from "react";
// The reason that we use NextLink is it uses client side routing
// How to use it is that wrap any link with NextLink
import NextLink from "next/link";
import { useLogoutMutation, useMeQuery } from "../generated/graphql";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useApolloClient } from "@apollo/client";

interface NavBarProps {}

export const NavBar: React.FC<NavBarProps> = ({}) => {
  // Since index page do SSR, it will send request to get the currently logged in user (MeQuery) on the next.js server
  // However, the next.js server does not have cookies, only graphql server have cookies (and it is pointless to make next.js to work with cookie because it is not useful info for SEO),
  // so the next.js server will just returns null even if the cookie is set.
  // It is an uesless query to run on server.
  // To fix this issue, make it to skip to send a request for MeQuery to next.js server when I am in server, and run it if I am in a browser.
  //
  // `isServer` tells me if I am in the server or in browser
  // `useEffect` is only executed in the browser (not is server) and is executed during hydration
  // Hydration, which is a feature of React, is the first render in the Browser
  const [isServer, setIsServer] = useState(true);
  useEffect(() => setIsServer(false), []);
  const { data, loading } = useMeQuery({
    skip: isServer, // now when I am in server, data will be undefined instead of null, which mean it is not runing request anymore.

    // now we can remove this pause since we now do the server side render Cookie Forwarding to set voteStatus value in Post entities.
    // But still we don't want to do the server side render so won't remove it.
  });
  const router = useRouter();

  // Need to see if it is loading (fetching)
  const [logout, { loading: logoutFetching }] = useLogoutMutation();
  // This is the hook we can get access to the current client
  const apolloClient = useApolloClient();
  let body;
  // There are three states:
  // 1. loading  2. not logged in  3. logged in
  if (loading) {
    body = null;
  } else if (!data?.me) {
    body = (
      <>
        <Flex>
          <Box color="white" mr={4}>
            <NextLink href="/login">login</NextLink>
          </Box>

          <Box color="white" mr={4}>
            <NextLink href="/register">register</NextLink>
          </Box>
        </Flex>
      </>
    );
  } else {
    body = (
      <Flex align="center">
        <Button mr={4} onClick={() => router.push("/create-post")}>
          create post
        </Button>
        <Box mr={4}>{data.me.username}</Box>
        <Button
          color="white"
          variant={"link"}
          onClick={async () => {
            await logout();
            // router.reload();
            // instead of reload as above line, reset cache (no need for update cache after logout mutation)
            await apolloClient.resetStore();
          }}
          isLoading={logoutFetching}
        >
          log out
        </Button>
      </Flex>
    );
  }
  return (
    <Flex zIndex={1} position="sticky" top={0} bg="teal" p={4} align="center">
      <Flex flex={1} m="auto" align="center" maxW={800}>
        <Box color="white">
          <NextLink href={"/"}>
            <Heading>Reddit Clone</Heading>
          </NextLink>
        </Box>
        <Box ml={"auto"}>{body}</Box>
      </Flex>
    </Flex>
  );
};
