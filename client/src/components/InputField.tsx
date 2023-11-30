import {
  FormControl,
  FormLabel,
  Input,
  FormErrorMessage,
  Textarea,
} from "@chakra-ui/react";
import { useField } from "formik";
import React, { InputHTMLAttributes } from "react";

// The InputField component will take any props that regular <input> HTML element field would take
type InputFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  name: string;
  label: string;
  textarea?: boolean;
};

export const InputField: React.FC<InputFieldProps> = ({
  label,
  size: _, // rename unused variable to _
  textarea,
  ...props
}) => {
  // A special hook from formik
  const [field, { error }] = useField(props);
  let childComponent;
  if (textarea) {
    childComponent = (
      <Textarea {...field} id={field.name} placeholder={props.placeholder} />
    );
  } else {
    childComponent = (
      <Input
        {...field}
        {...props}
        id={field.name}
        placeholder={props.placeholder}
      />
    );
  }
  return (
    <FormControl isInvalid={!!error}>
      <FormLabel htmlFor={field.name}>{label}</FormLabel>
      {childComponent}
      {error ? <FormErrorMessage>{error}</FormErrorMessage> : null}
    </FormControl>
  );
};

// !error
// when error = '' => true
// when error = "error message" => false

// this input field is now can be reused for anytype of input field
