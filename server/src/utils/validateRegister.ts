import { RegisterInput } from "src/resolvers/RegisterInput";

export const validateRegister = (registerInput: RegisterInput) => {
  // username shouldn't be empty
  if (registerInput.username.length <= 2) {
    return [
      {
        field: "username",
        message: "length must be greater than 2",
      },
    ];
  }

  // username should not inclue @
  if (registerInput.username.includes("@")) {
    return [
      {
        field: "username",
        message: "username cannot inclue @",
      },
    ];
  }

  // password shouldn't be empty
  if (registerInput.password.length <= 2) {
    return [
      {
        field: "password",
        message: "length must be greater than 2",
      },
    ];
  }

  // email should be valid form
  if (!registerInput.email.includes("@")) {
    return [
      {
        field: "email",
        message: "invalid email",
      },
    ];
  }
  return null;
};
