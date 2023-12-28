import { Box, Button, Flex } from "@chakra-ui/react";
import { Form, Formik } from "formik";
import { withUrqlClient } from "next-urql";
import NextLink from "next/link";
import { useRouter } from "next/router";
import React from "react";
import { InputField } from "../components/InputField";
import { Wrapper } from "../components/Wrapper";
import { useLoginMutation } from "../generated/graphql";
import { createUrqlClient } from "../utils/createUrqlClient";
import { toErrorMap } from "../utils/toErrorMap";

const Login: React.FC<{}> = ({}) => {
  const router = useRouter();
  // if you console log the router, you can see that query parameter is in "query" object with "next" key
  // console.log(router);
  const [, login] = useLoginMutation();
  return (
    <Wrapper variant="small">
      <Formik
        initialValues={{ usernameOrEmail: "", password: "" }}
        onSubmit={async (values, { setErrors }) => {
          const response = await login(values);
          if (response.data?.login.errors) {
            setErrors(toErrorMap(response.data.login.errors));
          } else if (response.data?.login.user) {
            // if this query parameter is defined, then that means there is a page to go back where user redirected from to log in page
            if (typeof router.query.next === "string") {
              // go back to the page
              router.push(router.query.next);
            } else {
              // else just go to home page
              router.push("/");
            }
          }
        }}
      >
        {({ isSubmitting }) => (
          <Form>
            <InputField
              name="usernameOrEmail"
              placeholder="username or email"
              label="Username or Email"
            />
            <Box mt={4}>
              <InputField
                name="password"
                placeholder="password"
                label="Password"
                type="password"
              />
            </Box>
            <Flex mt={2} ml="auto">
              <NextLink href={"/forgot-password"}>forgot password?</NextLink>
            </Flex>
            <Button
              mt={4}
              type="submit"
              isLoading={isSubmitting}
              colorScheme="teal"
            >
              login
            </Button>
          </Form>
        )}
      </Formik>
    </Wrapper>
  );
};

// SSR is off
// The reason that we need Urql client is so we you can call mutations
export default withUrqlClient(createUrqlClient)(Login);
