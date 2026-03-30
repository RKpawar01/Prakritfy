"use client";

import NextLink from "next/link";
import { useState } from "react";
import Form from "../home/Form";
import {
  Box,
  Button,
  Divider,
  Flex,
  Heading,
  Input,
  Link,
  SimpleGrid,
  Stack,
  Text,
} from "@chakra-ui/react";
import { FaFacebookF, FaInstagram, FaYoutube } from "react-icons/fa";

const footerLinks = [
  {
    title: "Company",
    items: [
      { label: "About", to: "/about" },
      { label: "Our Story", to: "/about#story" },
      { label: "Impact", to: "/about#impact" },
      { label: "Research & Stories", to: "/blog" },
    ],
  },
  {
    title: "Customer Care",
    items: [
      { label: "Conditions", to: "/conditions" },
      { label: "Herbal Kits", to: "/products" },
      { label: "Wellness Programs", to: "/wellness" },
      { label: "Contact Support", to: "/contact" },
      { label: "FAQ", to: "/contact#faq" },
    ],
  },
];

const socials = [
  { icon: <FaInstagram />, label: "Instagram", href: "#" },
  { icon: <FaFacebookF />, label: "Facebook", href: "#" },
  { icon: <FaYoutube />, label: "YouTube", href: "#" },
];

export default function Footer() {
  const [open, setOpen] = useState(false);
  return (
    <Box as="footer" position="relative" color="white">
      {/* TOP GLOW DIVIDER */}
      <Box
        position="absolute"
        top={0}
        left={0}
        right={0}
        h="2px"
        bgGradient="linear(to-r, transparent, #7CBF9E, transparent)"
      />

      {/* BACKGROUND */}
      <Box bgGradient="linear(to-b, #0F3D2E, #081F1A)">
        <Flex
          maxW="1200px"
          mx="auto"
          px={{ base: 5, md: 10 }}
          pt={{ base: 18, md: 28 }}
          direction="column"
          gap={20}
        >
          {/* MAIN GRID */}
          <SimpleGrid columns={{ base: 1, md: 4 }} spacing={14}>
            {/* BRAND */}
            <Stack spacing={6}>
              <Flex align="center" gap={3}>
                <Box
                  bgGradient="linear(to-br, #7CBF9E, #548F9D)"
                  rounded="xl"
                  px={3}
                  py={1.5}
                  fontWeight="800"
                  letterSpacing="widest"
                  fontSize="sm"
                  boxShadow="0 10px 30px rgba(124,191,158,0.4)"
                >
                  PR
                </Box>
                <Heading size="md" letterSpacing="tight">
                  Prakritify
                </Heading>
              </Flex>

              <Text color="whiteAlpha.800" fontSize="sm" lineHeight="1.8">
                Elevating ancient Ayurvedic wisdom with modern research to craft
                high-efficacy herbal solutions tailored for today’s conscious
                lifestyles.
              </Text>

              {/* SOCIALS */}
              <Flex gap={4}>
                {socials.map((social) => (
                  <Button
                    key={social.label}
                    as="a"
                    href={social.href}
                    aria-label={social.label}
                    size="sm"
                    rounded="full"
                    bg="whiteAlpha.100"
                    color="white"
                    backdropFilter="blur(6px)"
                    _hover={{
                      bg: "#7CBF9E",
                      color: "#0F3D2E",
                      transform: "translateY(-3px)",
                      boxShadow: "0 10px 25px rgba(124,191,158,0.6)",
                    }}
                  >
                    {social.icon}
                  </Button>
                ))}
              </Flex>
            </Stack>

            {/* LINKS */}
            {footerLinks.map((section) => (
              <Box key={section.title}>
                <Heading
                  size="xs"
                  textTransform="uppercase"
                  letterSpacing="widest"
                  mb={6}
                  color="whiteAlpha.900"
                >
                  {section.title}
                </Heading>

                <Stack spacing={3}>
                  {section.items.map((item) => (
                    <Link
                      key={item.label}
                      as={NextLink}
                      href={item.to}
                      fontSize="sm"
                      color="whiteAlpha.700"
                      _hover={{
                        color: "#7CBF9E",
                        transform: "translateX(4px)",
                      }}
                    >
                      {item.label}
                    </Link>
                  ))}
                </Stack>
              </Box>
            ))}

            {/* NEWSLETTER */}
            <Box
              bg="rgba(255,255,255,0.06)"
              backdropFilter="blur(14px)"
              rounded="2xl"
              p={6}
              boxShadow="0 20px 50px rgba(0,0,0,0.25)"
            >
              <Heading
                size="xs"
                textTransform="uppercase"
                letterSpacing="widest"
                mb={4}
              >
                Stay in the know
              </Heading>

              <Text color="whiteAlpha.800" fontSize="sm" mb={6}>
                Ayurvedic insights, seasonal rituals & exclusive offers —
                delivered weekly.
              </Text>

              <Stack spacing={4}>
                <Button
                  rounded="full"
                  bgGradient="linear(to-r, #7CBF9E, #548F9D)"
                  color="#0F3D2E"
                  fontWeight="700"
                  letterSpacing="wide"
                  _hover={{
                    transform: "translateY(-2px)",
                    boxShadow: "0 15px 40px rgba(124,191,158,0.6)",
                  }}
                  onClick={() => setOpen(true)}
                >
                  BOOK
                </Button>
                <Form open={open} setOpen={setOpen} />
              </Stack>
            </Box>
          </SimpleGrid>

          <Divider borderColor="whiteAlpha.200" />

          {/* BOTTOM BAR */}
          <Flex
            direction={{ base: "column", md: "row" }}
            justify="space-between"
            align={{ base: "flex-start", md: "center" }}
            gap={4}
            pb={12}
            fontSize="sm"
            color="whiteAlpha.700"
          >
            <Text>
              © {new Date().getFullYear()} Prakritify Ayurveda. All rights
              reserved.
            </Text>

            <Stack direction={{ base: "column", md: "row" }} spacing={6}>
              <Link
                as={NextLink}
                href="/contact#privacy"
                _hover={{ color: "#7CBF9E" }}
              >
                Privacy Policy
              </Link>
              <Link
                as={NextLink}
                href="/contact#terms"
                _hover={{ color: "#7CBF9E" }}
              >
                Terms of Service
              </Link>
              <Link
                as={NextLink}
                href="/contact#faq"
                _hover={{ color: "#7CBF9E" }}
              >
                FAQ
              </Link>
            </Stack>
          </Flex>
        </Flex>
      </Box>
    </Box>
  );
}
