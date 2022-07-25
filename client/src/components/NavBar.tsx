import { Box, Link, Flex, Button } from "@chakra-ui/react";
import React from "react";
// The reason that we use NextLink is it uses client side routing
// How to use it is that wrap any link with NextLink
import NextLink from "next/link";
import { useMeQuery } from "../generated/graphql";

interface NavBarProps {}

export const NavBar: React.FC<NavBarProps> = ({}) => {
  const [{ data, fetching }] = useMeQuery();
  let body;
  // There are three states:
  // 1. loading  2. not logged in  3. logged in
  if (fetching) {
    body = null;
  } else if (!data?.me) {
    body = (
      <>
        <NextLink href="/login">
          <Link color="white" mr={4}>
            login
          </Link>
        </NextLink>

        <NextLink href="/register">
          <Link color="white" mr={4}>
            register
          </Link>
        </NextLink>
      </>
    );
  } else {
    body = (
      <Flex>
        <Box mr={4}>{data.me.username}</Box>
        <Button color="white" variant={"link"}>
          log out
        </Button>
      </Flex>
    );
  }
  return (
    <Flex bg="tomato" p={4}>
      <Box ml={"auto"}>{body}</Box>
    </Flex>
  );
};
