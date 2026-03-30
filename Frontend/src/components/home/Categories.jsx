import {
  Box,
  Button,
  Heading,
  Image,
  SimpleGrid,
  Stack,
  Text,
  Tag,
} from "@chakra-ui/react";
import { useRouter } from "next/navigation";

const productCategories = [
  {
    img: "Diabetes.jpg",
    title: "Diabetes",
    description:
      "Balance blood sugar, enhance insulin sensitivity, and protect pancreatic function with targeted botanicals.",
  },
  {
    img: "Lipids.avif",
    title: "Lipids",
    description:
      "Manage cholesterol, reduce triglycerides, and boost metabolic resilience through evidence-led botanicals.",
  },
  {
    img: "Blood_Pressure.jpg",
    title: "Blood Pressure",
    description:
      "Stabilize blood pressure, improve circulation, and ease stress responses with adaptogenic formulations.",
  },
  {
    img: "Heart.jpg",
    title: "Heart Health",
    description:
      "Strengthen cardiac function, optimize lipids, and protect vascular integrity with cardiotonic herbs.",
  },
  {
    img: "Bone.png",
    title: " Bone/Joint/Nerve Health",
    description:
      "Support bone strength, improve joint flexibility, and promote nerve health for better mobility and overall wellness.",
  },
  {
    img: "Gut.webp",
    title: "Gut Health",
    description:
      "Support healthy digestion, improve gut balance, and enhance nutrient absorption with natural, targeted botanicals.",
  },
  {
    img: "Liver.jpg",
    title: "Liver",
    description:
      "Detoxify, regenerate, and elevate liver performance with antioxidant-rich herbs and nutraceuticals.",
  },
  {
    img: "PCOS.webp",
    title: "PCOS",
    description:
      "Regulate cycles, support hormonal harmony, and reduce inflammation with clinically-backed Ayurvedic blends.",
  },
];

function Categories() {
  const router = useRouter();

  return (
    <Box
      px={{ base: 4, md: 10 }}
      py={{ base: 16, md: 24 }}
      bgGradient="linear(to-b, #F8F6F2, #EEF5F3)"
    >
      <Box maxW="1200px" mx="auto">
        {/* Header */}
        <Stack spacing={4} textAlign="center" mb={16}>
          <Text
            textTransform="uppercase"
            fontSize="sm"
            letterSpacing="widest"
            color="#028f7d"
            fontWeight="600"
          >
            Conditions we specialise in
          </Text>

          <Heading
            color="#0F2F2A"
            fontSize={{ base: "2rem", md: "2.6rem" }}
            fontWeight="700"
            lineHeight="1.2"
          >
            Doctor-designed disease programmes <br />
            backed by potent herbology
          </Heading>

          <Text maxW="620px" mx="auto" color="#4A6F6A" fontSize="lg">
            Every condition is supported by clinically validated herbal stacks,
            nutrition roadmaps, and lifestyle coaching to address root causes.
          </Text>
        </Stack>

        {/* Cards */}
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={10}>
          {productCategories.map((item) => (
            <Stack
              key={item.title}
              bg="white"
              rounded="3xl"
              overflow="hidden"
              boxShadow="0 20px 50px rgba(0,0,0,0.08)"
              transition="all 0.35s ease"
              _hover={{
                transform: "translateY(-10px)",
                boxShadow: "0 35px 80px rgba(0,0,0,0.12)",
              }}
            >
              {/* Image */}
              <Box position="relative" h="220px">
                <Image
                  src={item.img}
                  alt={item.title}
                  h="100%"
                  w="100%"
                  objectFit="cover"
                />
                {/* subtle image overlay */}
                <Box
                  position="absolute"
                  inset="0"
                  bgGradient="linear(to-t, rgba(0,0,0,0.45), transparent)"
                />
              </Box>

              {/* Content */}
              <Stack spacing={4} p={6}>
                <Tag
                  alignSelf="flex-start"
                  bg="#E6F4F1"
                  color="#028f7d"
                  rounded="full"
                  px={4}
                  py={1}
                  fontWeight="600"
                >
                  {item.title}
                </Tag>

                <Text color="#4A6F6A" fontSize="md">
                  {item.description}
                </Text>

                <Button
                  onClick={() => router.push("/contact")}
                  rounded="full"
                  bg="#028f7d"
                  color="white"
                  size="sm"
                  fontWeight="600"
                  alignSelf="flex-start"
                  px={6}
                  _hover={{
                    bg: "#027468",
                    transform: "translateY(-1px)",
                  }}
                >
                  Book Free Consultation
                </Button>
              </Stack>
            </Stack>
          ))}
        </SimpleGrid>
      </Box>
    </Box>
  );
}

export default Categories;
