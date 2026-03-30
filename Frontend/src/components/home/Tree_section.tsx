"use client";

import {
  Box,
  Button,
  Heading,
  HStack,
  Icon,
  SimpleGrid,
  Stack,
  Text,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { FiHeart } from "react-icons/fi";
import { useState } from "react";
import AnimatedImage from "@/components/home/AnimatedImage";
import ValuePropositions from "@/components/home/ValuePropositions";
import OurStory from "@/components/home/OurStory";
import Categories from "@/components/home/Categories";
import Testimonials from "@/components/home/Testimonials";
import BlogHighlights from "@/components/home/BlogHighlights";
import CallToAction from "@/components/home/CallToAction";
import VideosSection from "@/components/home/VideosSection";
import Form from "../home/Form";


const MotionBox = motion(Box);

export default function Tree_section() {
  const [open, setOpen] = useState(false);
  return (
    <Box position="relative" overflow="hidden">
      {/* ================= HERO ================= */}
      <Box
        position="relative"
        minH={{ base: "100svh", md: "100vh" }}
        color="white"
        pt={{ base: 20, md: 28 }}
        pb={{ base: 20, md: 32 }}
      >
        {/* Background Image */}
        {/* Background Image */}

{/* Background Image */}
<Box
  position="absolute"
  inset="0"
  bgImage="url('/Wallpsper3.jpeg')"
  bgSize="cover"
  bgPosition="center"
  bgRepeat="no-repeat"
  zIndex={0}
/>

<Box
  position="absolute"
  inset="0"
  bg="rgba(0,0,0,0.15)"   //  LIGHT (not dark)
  zIndex={1}
/>

{/* Soft Brand Tint */}
<Box
  position="absolute"
  inset="0"
  bg="rgba(0,142,124,0.18)"  //  slightly reduced
  zIndex={2}
/>

        {/* Content */}
        <MotionBox
          position="relative"
          zIndex={3}
          maxW="1200px"
          mx="auto"
          px={{ base: 5, md: 8 }}
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <SimpleGrid
            columns={{ base: 1, md: 2 }}
            spacing={{ base: 12, md: 20 }}
            alignItems="center"
          >
            {/* LEFT */}
            <Stack spacing={8}>
              <Heading
                fontSize={{ base: "2.1rem", md: "3.6rem" }}
                lineHeight="1.15"
                fontWeight="700"
                letterSpacing="-0.02em"
                textShadow="0 6px 20px rgba(0,0,0,0.45)"
                textAlign={{ base: "center", md: "left" }}
              >
                Chronic Disease Management <br />
                <Text
                  as="span"
                  bgGradient="linear(to-r, #E6FFF8, #B9FFF1)"
                  bgClip="text"
                  fontWeight="800"
                >
                  Through Lifestyle, Diet & Herbs
                </Text>
              </Heading>

              <Text
                fontSize={{ base: "lg", md: "xl" }}
                color="whiteAlpha.900"
                maxW="520px"
                textShadow="0 4px 12px rgba(0,0,0,0.4)"
                textAlign={{ base: "center", md: "left" }}
              >
                Model Diagnostics · Ayurvedic & Herbal Treatment
              </Text>

              <HStack justify={{ base: "center", md: "flex-start" }}>
                <Button
                  size="lg"
                  px={12}
                  rounded="full"
                  bg="linear-gradient(135deg, #E6FFF8, #A7F3E8)"
                  color="#064E3B"
                  fontWeight="600"
                  boxShadow="0 20px 60px rgba(0,0,0,0.4)"
                  _hover={{
                    transform: "translateY(-2px)",
                    boxShadow: "0 30px 80px rgba(0,0,0,0.55)",
                  }}
                  onClick={() => setOpen(true)} // ✅ IMPORTANT
                >
                  Book Consultation
                </Button>
              </HStack>

              {/* ✅ KEEP FORM OUTSIDE */}
              <Form open={open} setOpen={setOpen} />

              <HStack
                spacing={3}
                px={6}
                py={4}
                rounded="2xl"
                backdropFilter="blur(14px)"
                bg="rgba(255,255,255,0.18)"
                border="1px solid rgba(255,255,255,0.3)"
                maxW="fit-content"
                mx={{ base: "auto", md: "0" }}
              >
                <Icon as={FiHeart} boxSize={5} color="#B9FFF1" />
                <Text fontSize="sm" fontWeight="500">
                  Ancient Wisdom · Modern Diagnostics
                </Text>
              </HStack>
            </Stack>

            {/* RIGHT IMAGE */}
          </SimpleGrid>
        </MotionBox>
      </Box>

      {/* ================= FLOATING FORM ================= */}

      

      {/* ================= REST OF SITE ================= */}
      <Categories />
      <ValuePropositions />

      <Testimonials />
      <CallToAction />

      {/* Optional sections */}
      {/* <OurStory /> */}
      {/* <VideosSection /> */}
      {/* <BlogHighlights /> */}
    </Box>
  );
}
