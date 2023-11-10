// the file name [token].tsx is a convension of Next.js that can be used when you want a variable in your url
import { Box, Button, Link, Flex } from "@chakra-ui/react";
import { Formik, Form } from "formik";
import { NextPage } from "next";
import React, { useState } from "react";
import { InputField } from "../../components/InputField";
import { Wrapper } from "../../components/Wrapper";
import { useChangePasswordMutation } from "../../generated/graphql";
import { toErrorMap } from "../../utils/toErrorMap";
import { withUrqlClient } from "next-urql";
import { createUrqlClient } from "../../utils/createUrqlClient";
import { useRouter } from "next/router";
import NextLink from "next/link";

// The parameter token is defined below with ChangePassword.getInitialProps = () => {}
const ChangePassword: NextPage<{ token: string }> = ({ token }) => {
  const [, changePassword] = useChangePasswordMutation();
  const [tokenError, setTokenError] = useState("");
  const router = useRouter();
  return (
    <Wrapper variant="small">
      <Formik
        initialValues={{ newPassword: "", newPasswordCheck: "" }}
        onSubmit={async (values, { setErrors }) => {
          if (values.newPassword !== values.newPasswordCheck) {
            setErrors({
              newPasswordCheck: "it does not match with the new password",
            });
            return;
          }
          const response = await changePassword({
            newPassword: values.newPassword,
            token: token,
          });
          if (response.data?.changePassword.errors) {
            const errorMap = toErrorMap(response.data.changePassword.errors);
            if ("token" in errorMap) {
              // we pass the error message for the token
              setTokenError(errorMap.token);
            }
            // we do set Error all the time because we might get token error and regular error at the same time
            setErrors(errorMap);
          } else if (response.data?.changePassword.user) {
            router.push("/");
          }
        }}
      >
        {({ isSubmitting }) => (
          <Form>
            <InputField
              name="newPassword"
              placeholder="new password"
              label="New password"
              type="password"
            />
            {tokenError ? (
              <Box>
                <Box mr={2} color={"red"}>
                  {tokenError}
                </Box>
                <NextLink href={"/forgot-password"}>
                  <Link>click here to get a new link</Link>
                </NextLink>
              </Box>
            ) : null}
            <Box mt={4}>
              <InputField
                name="newPasswordCheck"
                placeholder="new password check"
                label="New password check"
                type="password"
              />
            </Box>
            <Button
              mt={4}
              type="submit"
              isLoading={isSubmitting}
              colorScheme="teal"
            >
              change password
            </Button>
          </Form>
        )}
      </Formik>
    </Wrapper>
  );
};

// This is a special function from next.js
// Allow us to get any query parameters and pass it to the original function component (ChangePassword)
ChangePassword.getInitialProps = ({ query }) => {
  return {
    token: query.token as string,
  };
};

// next.js also has getServerProps() similar to getInitialProps() that runs in the server

export default withUrqlClient(createUrqlClient)(ChangePassword);
