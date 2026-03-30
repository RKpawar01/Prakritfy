"use client";

import {
  Box,
  Heading,
  SimpleGrid,
  Stack,
  Text,
  VStack,
} from "@chakra-ui/react";
import { CardSwap } from "../ui/CardSwap";

const journeySteps = [
  {
    title: "Root-cause diagnostics",
    description:
      "In-depth dosha assessment, lifestyle mapping, and lab work review to pinpoint imbalances.",
  },
  {
    title: "Personalized protocol",
    description:
      "Custom blends, diet guidance, breathwork, and sleep rituals delivered in a weekly plan.",
  },
  {
    title: "Digital habit coaching",
    description:
      "Track progress, sync wearables, and receive nudges from your Ayurvedic coach in-app.",
  },
  {
    title: "Measure & elevate",
    description:
      "Monthly progress labs, evolving formulations, and advanced therapies to keep you thriving.",
  },
];

export default function WellnessJourney() {
  return (
    <Box bg="#fff" py={{ base: 16, md: 20 }}>
      <Box maxW="1100px" 
  
 mx="auto" px={{ base: 4, md: 8 }}>
        {/* HEADER */}
        <Stack spacing={4} mb={12}>
          <Text
            textTransform="uppercase"
            fontSize="sm"
            letterSpacing="widest"
            color="#6da95c"
          >
            The pranista method
          </Text>
          <Heading color="#263d21" fontSize={{ base: "2.1rem", md: "2.6rem" }}>
            Designed to create sustainable health shifts in 90 days.
          </Heading>
          <Text color="#5a4237" maxW="620px">
            Your dedicated Ayurvedic care team blends diagnostics, hyper-personal
            rituals, and supportive coaching so every choice moves you toward
            lasting vitality.
          </Text>
        </Stack>

        {/* CARD GRID */}
        <SimpleGrid columns={{ base: 1, md: 4 }} spacing={8}>
          {journeySteps.map((step, index) => (
            <CardSwap
              key={step.title}
              front={
                <VStack
                  align="flex-start"
                  bg="white"
                  px={6}
                  py={8}
                  rounded="2xl"
                  boxShadow="2xl"
                  position="relative"
                >
                  <Box
                    position="absolute"
                    top={-4}
                    left={6}
                    bg="#6da95c"
                    color="white"
                    rounded="full"
                    px={3}
                    py={1}
                    fontWeight="600"
                    fontSize="sm"
                  >
                    {String(index + 1).padStart(2, "0")}
                  </Box>

                  <Heading size="md" pt={6}>
                    {step.title}
                  </Heading>
                  <Text color="gray.600">
                    Tap to see more →
                  </Text>
                </VStack>
              }
              back={
                <VStack
                  align="flex-start"
                  bg="#f5f8f3"
                  px={6}
                  py={8}
                  rounded="2xl"
                  boxShadow="2xl"
                >
                  <Heading size="md">{step.title}</Heading>
                  <Text color="gray.700">{step.description}</Text>
                </VStack>
              }
            />
          ))}
        </SimpleGrid>
      </Box>
    </Box>
  );
}
