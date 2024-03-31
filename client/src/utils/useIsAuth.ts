import { useRouter } from "next/router";
import { useEffect } from "react";
import { useMeQuery } from "../generated/graphql";

// This is a custom hook that can be used to check if a user is logged in
export const useIsAuth = () => {
  const router = useRouter();
  const { data, loading } = useMeQuery();
  // if you take a look at the router pathname or route field, we know where we are
  // we can pass this as a parameter when we nevigate to the login page
  // console.log(router);

  // Check if user is logged in and if not, then redirect to login page
  // Also consider fetching state
  useEffect(() => {
    if (!loading && !data?.me) {
      // Pass the pathname that indicatin where we are as a parameter
      // This was we can tell the login page where we should go next after login is done
      // Exmaple: http://localhost:3000/login?next=/create-post
      router.replace("/login?next=" + router.pathname);
    }
  }, [data, loading, router]);
};
