import { Box, Button } from "@chakra-ui/react";
import { Form, Formik } from "formik";
import { withUrqlClient } from "next-urql";
import { InputField } from "../components/InputField";
import { useCreatePostMutation } from "../generated/graphql";
import { createUrqlClient } from "../utils/createUrqlClient";
import { useRouter } from "next/router";
import { Layout } from "../components/Layout";
import { useIsAuth } from "../utils/useIsAuth";

const createPost: React.FC<{}> = ({}) => {
  // It is a bad user experience to redirect users from creat-post page to login page after they finish writing the content for the post
  // So before users start writing, redirect them to login page if they are not loged in
  const router = useRouter();
  useIsAuth();
  const [, createPost] = useCreatePostMutation();
  return (
    <Layout variant="small">
      <Formik
        initialValues={{ text: "", title: "" }}
        onSubmit={async (values) => {
          const { error } = await createPost({ createPostInput: values });
          if (!error) {
            // redirect when creating post is done
            router.push("/");
          }
          // if there is an error, the global error handler will handle it. It is in createUrqlClient.ts. (errorExchange)
        }}
      >
        {({ isSubmitting }) => (
          <Form>
            <InputField name="title" placeholder="title" label="Title" />
            <Box mt={4}>
              <InputField
                name="text"
                placeholder="text..."
                label="Body"
                textarea
              />
            </Box>
            <Button
              mt={4}
              type="submit"
              isLoading={isSubmitting}
              colorScheme="teal"
            >
              create post
            </Button>
          </Form>
        )}
      </Formik>
    </Layout>
  );
};

export default withUrqlClient(createUrqlClient)(createPost);
