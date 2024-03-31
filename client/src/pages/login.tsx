import { Box, Button, Flex } from "@chakra-ui/react";
import { Form, Formik } from "formik";
import NextLink from "next/link";
import { useRouter } from "next/router";
import React from "react";
import { InputField } from "../components/InputField";
import { Wrapper } from "../components/Wrapper";
import { MeDocument, MeQuery, useLoginMutation } from "../generated/graphql";
import { toErrorMap } from "../utils/toErrorMap";
import { withApollo } from "../utils/createApolloClient";

const Login: React.FC<{}> = ({}) => {
  const router = useRouter();
  // if you console log the router, you can see that query parameter is in "query" object with "next" key
  // console.log(router);
  const [login] = useLoginMutation();
  return (
    <Wrapper variant="small">
      <Formik
        initialValues={{ usernameOrEmail: "", password: "" }}
        onSubmit={async (values, { setErrors }) => {
          const response = await login({
            variables: values,
            // update cache after mutation using update function.
            // the second argument to update function is the result of the mutation.
            update: (cache, { data }) => {
              // data is the result of the register, and this sticks that in the cache for me Query.
              cache.writeQuery<MeQuery>({
                query: MeDocument,
                data: {
                  __typename: "Query",
                  me: data?.login.user,
                },
              });
              // evict all of the posts because user is specified
              cache.evict({ fieldName: "posts" });
            },
          });
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
            <Flex>
              <Button
                mt={4}
                type="submit"
                isLoading={isSubmitting}
                colorScheme="teal"
              >
                login
              </Button>
              <Box ml={4} mt="auto">
                <NextLink href={"/register"}>Not a user yet?</NextLink>
              </Box>
            </Flex>
          </Form>
        )}
      </Formik>
    </Wrapper>
  );
};

// SSR is off
// The reason that we need Urql client is so we you can call mutations
export default withApollo({ ssr: false })(Login);
