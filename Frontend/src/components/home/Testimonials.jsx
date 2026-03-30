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
  useBreakpointValue,
  Flex,
  Badge,
} from "@chakra-ui/react";
import { FaQuoteLeft, FaArrowRight, FaArrowLeft, FaStar } from "react-icons/fa";
import { useState } from "react";

const testimonials = [
  {
    name: "Pratima Dubey",
    role: "Owner · Therapy Center, Faridabad",
    quote:
      "Significant reduction in pain with Asthisudha Oil. Highly effective and reliable treatment.",

    rating: 5,
    condition: "Chronic Pain",
  },
  {
    name: "Aditi Sharma",
    role: "Entrepreneur · PCOS program",
    quote:
      "Six weeks into the protocol, my cycles normalized and energy came rushing back. The constant support and habit nudges kept me on track.",

    rating: 5,
    condition: "PCOS",
  },
  {
    name: "Rohit Menon",
    role: "Marathoner · Diabetes program",
    quote:
      "My sugar fluctuations reduced by 30% without losing training volume. The herbs pair seamlessly with my endurance nutrition.",
    rating: 5,
    condition: "Diabetes",
  },
  {
    name: "Nisha Kapoor",
    role: "Creative director · Stress reset kit",
    quote:
      "The sleep elixir and breath protocols rewired my nervous system. I feel grounded, focused, and finally restful.",
    rating: 5,
    condition: "Stress Management",
  },
  {
    name: "Karan Verma",
    role: "Fitness Coach",
    quote: "Amazing transformation in energy and digestion.",
    rating: 4,
    condition: "Digestive Health",
  },
  {
    name: "Meera Joshi",
    role: "Working Professional",
    quote: "Stress reduced and sleep quality improved a lot.",
    rating: 5,
    condition: "Sleep & Stress",
  },
];

function Testimonials() {
  const [index, setIndex] = useState(0);
  const itemsPerPage = useBreakpointValue({ base: 1, md: 3 }) || 3;

  const next = () => {
    if (index + itemsPerPage < testimonials.length) {
      setIndex(index + itemsPerPage);
    } else {
      setIndex(0);
    }
  };

  const prev = () => {
    if (index - itemsPerPage >= 0) {
      setIndex(index - itemsPerPage);
    } else {
      setIndex(testimonials.length - itemsPerPage);
    }
  };

  const visibleItems = testimonials.slice(index, index + itemsPerPage);

  return (
    <Box bg="#f8fafc" py={{ base: 16, md: 24 }} position="relative">
      <Box maxW="1200px" mx="auto" px={{ base: 4, md: 6 }}>
        {/* HEADER */}
        <Box textAlign="center" mb={16}>
          <Heading
            color="#00796a"
            fontSize={{ base: "2rem", md: "3rem", lg: "3.5rem" }}
            fontWeight="bold"
            lineHeight="1.2"
            maxW="900px"
            mx="auto"
            mb={6}
          >
            Majority of patients reported{" "}
            <Box as="span" color="#c38a4c" display="inline-block">
              better digestion
            </Box>
            , energy levels, significant reduction in symptoms
          </Heading>

          <Text
            color="#4e8c98"
            fontSize="lg"
            maxW="700px"
            mx="auto"
            lineHeight="1.6"
          >
            We combine precise formulations, daily rituals, and compassionate
            coaching to transform your health markers and how you feel in your
            body.
          </Text>
        </Box>

        {/* TESTIMONIAL GRID */}
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={8}>
          {visibleItems.map((item) => (
            <Stack
              key={item.name}
              bg="white"
              px={8}
              py={10}
              rounded="2xl"
              spacing={6}
              position="relative"
              boxShadow="lg"
              transition="all 0.2s"
              _hover={{
                transform: "translateY(-4px)",
                boxShadow: "xl",
              }}
            >
              {/* Quote icon */}
              <Icon
                as={FaQuoteLeft}
                boxSize={10}
                color="#c38a4c"
                position="absolute"
                top={-5}
                left={8}
                opacity={0.3}
              />

              {/* Rating stars */}
              <HStack spacing={1} mb={2}>
                {[...Array(5)].map((_, idx) => (
                  <Icon
                    key={idx}
                    as={FaStar}
                    color={idx < item.rating ? "#c38a4c" : "#e2e8f0"}
                    boxSize={4}
                  />
                ))}
              </HStack>

              <Text
                fontSize="lg"
                color="gray.700"
                lineHeight="1.6"
                fontStyle="italic"
              >
                “{item.quote}”
              </Text>

              {/* Improvement badge */}
              {item.improvement && (
                <Badge
                  bg="#00796a"
                  color="white"
                  alignSelf="flex-start"
                  px={3}
                  py={1}
                  borderRadius="full"
                  fontSize="xs"
                >
                  {item.improvement} improvement
                </Badge>
              )}

              <HStack spacing={4} pt={2}>
                <Avatar
                  name={item.name}
                  src={item.avatar}
                  size="lg"
                  border="2px solid #c38a4c"
                />
                <Box>
                  <Text fontWeight="bold" color="gray.800" fontSize="md">
                    {item.name}
                  </Text>
                  <Text fontSize="sm" color="gray.500">
                    {item.role}
                  </Text>
                  {item.condition && (
                    <Text fontSize="xs" color="#00796a" mt={1}>
                      {item.condition}
                    </Text>
                  )}
                </Box>
              </HStack>

              {/* Decorative line */}
              <Box
                position="absolute"
                bottom={0}
                left={0}
                right={0}
                h="3px"
                bg="#00796a"
                borderRadius="full"
                opacity={0.3}
              />
            </Stack>
          ))}
        </SimpleGrid>

        {/* BUTTONS */}
        <Flex justify="center" mt={12} gap={4}>
          <Button
            onClick={prev}
            size="lg"
            leftIcon={<FaArrowLeft />}
            bg="white"
            color="#00796a"
            borderRadius="full"
            px={8}
            border="1px solid"
            borderColor="#00796a"
            _hover={{
              bg: "#00796a",
              color: "white",
            }}
          >
            Previous
          </Button>

          <Button
            onClick={next}
            size="lg"
            rightIcon={<FaArrowRight />}
            bg="#00796a"
            color="white"
            borderRadius="full"
            px={8}
            _hover={{
              bg: "#c38a4c",
            }}
          >
            Next
          </Button>
        </Flex>

        {/* Simple Pagination dots */}
        <HStack justify="center" mt={8} spacing={2}>
          {Array.from({
            length: Math.ceil(testimonials.length / itemsPerPage),
          }).map((_, idx) => (
            <Box
              key={idx}
              as="button"
              w={idx === Math.floor(index / itemsPerPage) ? "20px" : "6px"}
              h="6px"
              borderRadius="full"
              bg={
                idx === Math.floor(index / itemsPerPage) ? "#00796a" : "#cbd5e0"
              }
              transition="width 0.2s"
              onClick={() => setIndex(idx * itemsPerPage)}
            />
          ))}
        </HStack>
      </Box>
    </Box>
  );
}

export default Testimonials;
