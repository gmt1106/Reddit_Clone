import { NavBar } from "./NavBar";
import { Wrapper, WrapperVariant } from "./Wrapper";

interface LayoutProps {
  children: any;
  variant?: WrapperVariant;
}

export const Layout: React.FC<LayoutProps> = ({ children, variant }) => {
  return (
    <>
      <NavBar />
      <Wrapper variant={variant}>{children}</Wrapper>
    </>
  );
};
