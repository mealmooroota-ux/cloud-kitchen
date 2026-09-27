import { Header } from "./Header";
import { Footer } from "./Footer";
import { MobileCartBar } from "@/components/cart/CartButton";
import { MotionLayer } from "@/components/motion/MotionLayer";

export function Shell({ children, cartBar = true }: { children: React.ReactNode; cartBar?: boolean }) {
  return (
    <>
      <Header />
      <main id="main">{children}</main>
      <Footer />
      {cartBar && <MobileCartBar />}
      <MotionLayer />
    </>
  );
}
