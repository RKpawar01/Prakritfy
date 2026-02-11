"use client";

import {
  Box,
  Heading,
  Icon,
  Stack,
  Text,
  SimpleGrid,
  Flex,
} from "@chakra-ui/react";
import { BiLeaf } from "react-icons/bi";
import {
  TbHeartbeat,
  TbMicroscope,
  TbDeviceMobileHeart,
  TbHeartPlus,
  TbStethoscope,
  TbUserCheck,
  TbShieldCheck,
} from "react-icons/tb";

/* ICON MAP */
const iconMap = {
  heartbeat: TbHeartbeat,
  microscope: TbMicroscope,
  mobile: TbDeviceMobileHeart,
  leaf: BiLeaf,
   heartPlus: TbHeartPlus,
  stethoscope: TbStethoscope,
  userCheck: TbUserCheck,
  shieldCheck: TbShieldCheck,

};

/* PILLARS DATA */
const pillars = [
   {
    title: "Root Cause Analysis",
    description:
      "In Depth Lifestyle Assessment, Diet Pattern, Nutrition Deficiency, Appropriate Lab Work To Identify Chronic Disease Drivers.",
    icon: "heartbeat",
  },
  {
    title: "Personalized care rituals",
    description:
      "Clinical experts decode chronic disease drivers, interpret labs, and craft remission-focused plans.",
    icon: "heartPlus",
  },
 
  {
    title: "Clinically validated formulations",
    description:
      "Each blend undergoes multi-stage testing, stability checks, and independent lab validation for safety.",
    icon: "microscope",
  },
  // {
  //   title: "End-to-end digital care",
  //   description:
  //     "Condition dashboards, habit trackers, and progress insights make tracking remissions effortless.",
  //   icon: "mobile",
  // },
  // {
  //   title: "Best In Class Ingredientz",
  //   description:
  //     "Top Quality Sourced, Pestcides Screening, Heavy Meatel Testing, Microbial Analysis ",
  //   icon: "leaf",
  // },
  // {
  //   title: "Exercise Regimen",
  //   description:
  //     "Right Combination Of Endurance Aerobic, Strength, HIT, Yoga, Pranayam.  ",
  //   icon: "userCheck",
  // },
  
];



export default function ValuePropositions() {
  return (
    <Box bg="#f3e6d8" py={{ base: 16, md: 24 }}>
      {/* SECTION TITLE */}
      <Stack
        spacing={6}
        maxW="70%"
        mb={12}
        pl={{ base: "5%", md: "15%" }}
      >
        <Text
          textTransform="uppercase"
          fontSize="sm"
          letterSpacing="widest"
          color="#026aa2"
        >
          Why Prakritify  works for chronic disease
        </Text>

        <Heading
          color="#026aa2"
          fontSize={{ base: "2.2rem", md: "2.8rem" }}
        >
          Condition-personalised protocols backed by data, guided by doctors, and
          powered by clean formulations.
        </Heading>
      </Stack>

      {/* PILLAR CARDS */}
      <Flex
        gap={8}
        px={{ base: 4, md: 16 }}
        wrap="wrap"
        justify="center"
      >
        {pillars.map((pillar) => {
          const IconComponent = iconMap[pillar.icon];

          return (
            <Box
              key={pillar.title}
              w="360px"
             bgGradient="linear(to-r,  #008f7c, #54909d)"
        
              border="1px solid white"
              boxShadow="2xl"
              px={8}
              py={10}
              rounded="2xl"
              transition="all 0.3s ease"
              _hover={{
                transform: "translateY(-8px)",
                boxShadow: "2xl",
              }}
            >
              <Icon
                as={IconComponent}
                boxSize={10}
                color="#026aa2"
                mb={6}
                bg="#f3e6d8"
                p={2}
                rounded="xl"
              />

              <Heading size="md" mb={4}>
                {pillar.title}
              </Heading>

              <Text color="white">
                {pillar.description}
              </Text>
            </Box>
          );
        })}
      </Flex>

    </Box>
  );
}
