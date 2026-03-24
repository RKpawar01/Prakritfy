import {
  Avatar,
  Box,
  Heading,
  HStack,
  Icon,
  SimpleGrid,
  Stack,
  Text,
  Button,
} from "@chakra-ui/react";
import { FaQuoteLeft } from "react-icons/fa";
import { useState } from "react";
import { motion } from "framer-motion";

const MotionStack = motion(Stack);

const testimonials = [
  {
    name: "Aditi Sharma",
    role: "Entrepreneur · PCOS program",
    quote:
      "Six weeks into the protocol, my cycles normalized and energy came rushing back. The constant support and habit nudges kept me on track.",
    avatar: "https://i.pravatar.cc/150?img=47",
  },
  {
    name: "Rohit Menon",
    role: "Marathoner · Diabetes program",
    quote:
      "My sugar fluctuations reduced by 30% without losing training volume. The herbs pair seamlessly with my endurance nutrition.",
    avatar: "https://i.pravatar.cc/150?img=12",
  },
  {
    name: "Nisha Kapoor",
    role: "Creative director · Stress reset kit",
    quote:
      "The sleep elixir and breath protocols rewired my nervous system. I feel grounded, focused, and finally restful.",
    avatar: "https://i.pravatar.cc/150?img=33",
  },
  {
    name: "Pratima Dubey",
    role: "Owner · Therapy Center, Faridabad",
    quote:
      "Significant reduction in pain with Asthisudha Oil. Highly effective and reliable treatment.",
    avatar: "https://i.pravatar.cc/150?img=5",
  },
  {
    name: "Karan Verma",
    role: "Fitness Coach",
    quote: "Amazing transformation in energy and digestion.",
    avatar: "https://i.pravatar.cc/150?img=20",
  },
  {
    name: "Meera Joshi",
    role: "Working Professional",
    quote: "Stress reduced and sleep quality improved a lot.",
    avatar: "https://i.pravatar.cc/150?img=25",
  },
];

function Testimonials() {
  const [index, setIndex] = useState(0);
  const itemsPerPage = 3;

  const next = () => {
    if (index + itemsPerPage < testimonials.length) {
      setIndex(index + itemsPerPage);
    }
  };

  const prev = () => {
    if (index - itemsPerPage >= 0) {
      setIndex(index - itemsPerPage);
    }
  };

  const visibleItems = testimonials.slice(index, index + itemsPerPage);

  return (
    <Box bg="white" py={{ base: 16, md: 20 }}>
      <Box maxW="1100px" mx="auto" px={{ base: 4, md: 8 }}>
        {/* HEADER */}
        <Stack spacing={4} textAlign="center" mb={12} maxW="720px" mx="auto">
          <Text
            textTransform="uppercase"
            fontSize="sm"
            letterSpacing="widest"
            color="#00796a"
          >
            Results that speak
          </Text>

          <Heading color="#00796a" fontSize={{ base: "2.2rem", md: "2.6rem" }}>
            Majority of patients reported better digestion, energy levels,
            significant reduction in symptoms and improvement in diagnostic
            reports
          </Heading>

          <Text color="#4e8c98">
            We combine precise formulations, daily rituals, and compassionate
            coaching to transform your health markers and how you feel in your
            body.
          </Text>
        </Stack>

        {/* TESTIMONIAL GRID */}
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={8}>
          {visibleItems.map((item, i) => (
            <MotionStack
              key={item.name}
              bg="#008573"
              px={8}
              py={10}
              rounded="2xl"
              spacing={6}
              position="relative"
              border="0.5px solid"
              borderColor="white"
              boxShadow="2xl"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.4,
                delay: i * 0.1,
              }}
            >
              <Icon
                as={FaQuoteLeft}
                boxSize={10}
                color="#c38a4c"
                position="absolute"
                top={-5}
                left={8}
              />

              <Text fontSize="lg" color="#fff">
                “{item.quote}”
              </Text>

              <HStack spacing={4} pt={4}>
                <Avatar name={item.name} src={item.avatar} size="md" />
                <Box>
                  <Text fontWeight="600" color="white">
                    {item.name}
                  </Text>
                  <Text fontSize="sm" color="gray.200">
                    {item.role}
                  </Text>
                </Box>
              </HStack>
            </MotionStack>
          ))}
        </SimpleGrid>

        {/* BUTTONS */}
        <HStack justify="center" mt={10} spacing={4}>
          <Button onClick={prev} isDisabled={index === 0}>
            ← Prev
          </Button>
          <Button
            onClick={next}
            isDisabled={index + itemsPerPage >= testimonials.length}
          >
            Next →
          </Button>
        </HStack>
      </Box>
    </Box>
  );
}

export default Testimonials;
