import {
  Avatar,
  Box,
  Heading,
  HStack,
  Icon,
  SimpleGrid,
  Stack,
  Text,
} from "@chakra-ui/react";
import { FaQuoteLeft } from "react-icons/fa";

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
];

function Testimonials() {
  return (
    <Box bg="white" py={{ base: 16, md: 20 }}>
      <Box maxW="1100px" mx="auto" px={{ base: 4, md: 8 }}>
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
            93% of members report improved energy, sleep, and digestion within 45 days.
          </Heading>
          <Text color="#4e8c98">
            We combine precise formulations, daily rituals, and compassionate coaching to
            transform your health markers and how you feel in your body.
          </Text>
        </Stack>

        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={8}>
          {testimonials.map((item) => (
            <Stack
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
                  <Text fontWeight="600" color="deepGreen">
                    {item.name}
                  </Text>
                  <Text fontSize="sm" color="neutral.500">
                    {item.role}
                  </Text>
                </Box>
              </HStack>
            </Stack>
          ))}
        </SimpleGrid>
      </Box>
    </Box>
  );
}

export default Testimonials;
