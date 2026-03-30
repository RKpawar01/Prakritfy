"use client";

import dynamic from "next/dynamic";
import Tree_section from "@/components/home/Tree_section";
import Footer from "@/components/Universal/Footer";
import { NavbarDemo } from "@/components/Universal/NavbarDemo";
import { useState } from "react";
import { Box } from "@chakra-ui/react";

const SplashScreen = dynamic(
  () => import("@/components/Universal/SplashScreen"),
  { ssr: false }
);

export default function Home() {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <>
      {showSplash && (
        <SplashScreen onFinish={() => setShowSplash(false)} />
      )}

      {!showSplash && (
        <Box w="100%" minH="100vh" bg="#71d2ba">
          {/* bgGradient="linear(to-r, #026aa2, #35b6b4)"  */}
          {/* bgGradient="linear(to-r, #0F3D2E, #7CBF9E)"  */}
          {/* bgGradient="linear(to-r, #548F9DBF, #548F9D40)" */}
          <NavbarDemo />
          <Tree_section />
          <Footer />
        </Box>
      )}
    </>
  );
}