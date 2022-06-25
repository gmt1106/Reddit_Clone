import { Box } from "@chakra-ui/react";
import React from "react";

interface WrapperProps {
  children;
  variant?: "small" | "regualr";
}

// Box element in chakra is like a <div> but you can style it
export const Wrapper: React.FC<WrapperProps> = ({ children, variant }) => {
  return (
    <Box
      mt={8}
      mx="auto"
      maxW={variant === "regualr" ? "800px" : "400px"}
      w="100%"
    >
      {children}
    </Box>
  );
};
