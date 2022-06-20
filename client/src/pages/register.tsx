import React from "react";
import { Formik, Form } from "formik";

interface registerProps {}

export const Register: React.FC<registerProps> = ({}) => {
  return (
    <Formik
      initialValues={{ username: "", password: "" }}
      onSubmit={(values) => {
        console.log(values);
      }}
    >
      {() => (
        <Form>
          <div>hello</div>
        </Form>
      )}
    </Formik>
  );
};

export default Register;
// In next.js have to exprot default the component.
// If you are only exporting a single class or function, use export default.
// If a module’s primary purpose is to house one specific export, then you should consider exporting it as a default export.
// This makes both importing and actually using the import a little easier.
