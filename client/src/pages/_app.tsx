import { ChakraProvider } from "@chakra-ui/react";
import { createClient, Provider } from "urql";
import theme from "../theme";
import { AppProps } from "next/app";

// client is my graphQL server
const client = createClient({
  url: "http://localhost:4000/graphql",
  fetchOptions: {
    credentials: "include", // send a cookie
  },
});

// cover the app with urql provider
function MyApp({ Component, pageProps }: AppProps) {
  return (
    <Provider value={client}>
      <ChakraProvider resetCSS theme={theme}>
        <Component {...pageProps} />
      </ChakraProvider>
    </Provider>
  );
}

export default MyApp;
