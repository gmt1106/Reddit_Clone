import { FieldError } from "../generated/graphql";

// graphql returns a list of FieldErrors which has a form [{field: username, message: explanation of error}]
// This function change this to an object
export const toErrorMap = (errors: FieldError[]) => {
    const errorMap: Record<string, string> = {}
    errors.forEach(({field, message}) => {
        errorMap[field] =  message;
    });

    return errorMap;
}