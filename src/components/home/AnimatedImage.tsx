"use client";

import { motion } from "framer-motion";
import { Image } from "@chakra-ui/react";

export default function AnimatedImage() {
  return (
    <motion.div
      initial={{ y: 120, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.9, ease: "easeOut" }}
    >
      <Image
        // src="/Front.png"
        alt="Herbal disease-care rituals"
        w="full"
        maxW={{ base: "100%", md: "100%" }}
        mx="screen"
        position="relative"
        rounded="xl"
      />
    </motion.div>
  );
}
