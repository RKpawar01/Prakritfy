"use client";

import { Box, Flex, Icon, Tooltip } from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import { FaWhatsapp } from "react-icons/fa";

const pulseRing = keyframes`
  0% {
    transform: scale(0.9);
    box-shadow: 0 0 0 0 rgba(37, 211, 102, 0.7);
  }
  70% {
    transform: scale(1);
    box-shadow: 0 0 0 20px rgba(37, 211, 102, 0);
  }
  100% {
    transform: scale(0.9);
    box-shadow: 0 0 0 0 rgba(37, 211, 102, 0);
  }
`;

export default function WhatsAppButton() {
  return (
    <Box position="fixed" bottom={{ base: "24px", md: "40px" }} right={{ base: "24px", md: "40px" }} zIndex="9999">
      <Tooltip label="Chat with us" placement="left" hasArrow bg="#25d366" color="white" fontWeight="bold">
        <Box
          as="a"
          href="https://wa.me/917058258025?text=Hi"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Flex
            align="center"
            justify="center"
            bg="#25d366"
            color="white"
            w={{ base: "60px", md: "70px" }}
            h={{ base: "60px", md: "70px" }}
            borderRadius="full"
            boxShadow="lg"
            position="relative"
            transition="all 0.3s ease"
            _hover={{
              transform: "scale(1.05)",
              bg: "#20b958",
              boxShadow: "xl",
            }}
            _before={{
              content: "''",
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              borderRadius: "full",
              animation: `${pulseRing} 2s cubic-bezier(0.4, 0, 0.6, 1) infinite`,
              zIndex: -1,
            }}
          >
            <Icon as={FaWhatsapp} boxSize={{ base: 8, md: 9 }} />
          </Flex>
        </Box>
      </Tooltip>
    </Box>
  );
}
