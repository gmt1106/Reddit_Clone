// the file name [token].tsx is a convension of Next.js that can be used when you want a variable in your url
import { Box, Button } from "@chakra-ui/react";
import { Form, Formik } from "formik";
import { NextPage } from "next";
import { withUrqlClient } from "next-urql";
import NextLink from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import { InputField } from "../../components/InputField";
import { Wrapper } from "../../components/Wrapper";
import { useChangePasswordMutation } from "../../generated/graphql";
import { createUrqlClient } from "../../utils/createUrqlClient";
import { toErrorMap } from "../../utils/toErrorMap";

// The parameter token is defined below with ChangePassword.getInitialProps = () => {}
const ChangePassword: NextPage<{ token: string }> = () => {
  const [, changePassword] = useChangePasswordMutation();
  const [tokenError, setTokenError] = useState("");

  // Actaully the router is saving the query parameter
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
            // the empty token will throw back an error
            token:
              typeof router.query.token === "string" ? router.query.token : "",
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
                  click here to get a new link
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
// Actaully the router is saving the query parameter, so we don't need this anymore
// If you page does not use getInitialProps then Next.js will make the page static and optimize it
// So it is better to remove it if we don't need this
// ChangePassword.getInitialProps = ({ query }) => {
//   return {
//     token: query.token as string,
//   };
// };

// next.js also has getServerProps() similar to getInitialProps() that runs in the server

export default withUrqlClient(createUrqlClient)(ChangePassword);
