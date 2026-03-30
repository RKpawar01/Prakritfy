import {
  Box,
  Heading,
  Text,
  Image,
  SimpleGrid,
  Stack,
  HStack,
  Icon,
  Tag,
} from "@chakra-ui/react";
import { IoCheckbox } from "react-icons/io5";

const ourStoryContent = [
  {
    img: "https://res.cloudinary.com/dlsv90kui/image/upload/v1755712329/img1_mb0him.png",
    title: "Health by Nature",
    description:
      "We believe in harnessing the natural power of herbs to promote fitness and healing. Herbs are incredibly potent, and the human body possesses remarkable self-healing abilities. Our formulations are thoughtfully designed to naturally activate and enhance the body’s innate healing capabilities, supporting holistic wellness and balanced health.",
  },
  {
    img: "https://res.cloudinary.com/dlsv90kui/image/upload/v1755712329/img2_z4xsj2.png",
    title: "Innovation at the Forefront",
    description:
      "Innovation is a daily commitment. Our research team brings outstanding academic and clinical backgrounds in herbal pharmacology, clinical validation, and scientific formulation. We stay current with global breakthroughs across Ayurveda, herbal science, nutraceuticals, advanced extraction, phytochemical profiling, nanotechnology, and modern wellness solutions—engineering evidence-backed, high-efficacy products that honour tradition while embracing discovery.",
  },
  {
    img: "https://res.cloudinary.com/dlsv90kui/image/upload/v1755712329/img4_tf4hhi.png",
    title: "Ingredientz: Best-in-Class Sourcing",
    description:
      "At the heart of every formulation lies an uncompromising commitment to ingredient integrity. We partner with trusted, certified suppliers to guarantee purity and transparency.",
    points: [
      "Top Quality: Species identification, heavy metal screening, and microbial analysis ensure potent, safe botanicals in every batch.",
      "Certified & Traceable: GACP certified sources with full batch traceability.",
      "Sustainably & Ethically Sourced: Eco-conscious cultivation that protects biodiversity.",
      "Globally Compliant: Adherence to Indian and international pharmacopoeias.",
    ],
  },
  {
    img: "https://res.cloudinary.com/dlsv90kui/image/upload/v1755712329/img3_al1uat.png",
    title: "Scientific Approach",
    description:
      "Our multidisciplinary R&D team blends functional medicine, classical Ayurvedic texts with modern analytical science to design holistic, evidence-backed formulations.",
    points: [
      "Integrative methodology with lab validation and clinical evaluation.",
      "Evidence-driven innovation guided by global standards.",
      "Personalized focus considering prakriti and mind-body balance.",
      "Quality & transparency from source to finished product.",
      "Continuous learning and clinical collaboration.",
    ],
  },
  {
    img: "https://res.cloudinary.com/dlsv90kui/image/upload/v1755712329/img5_u4j081.png",
    title: "Top Notch Production Facilities",
    description:
      "Our GMP-certified facilities follow stringent national and international quality protocols to preserve potency and safety in every step.",
    points: [
      "Compliance with FSSAI, ISO, WHO-GMP standards.",
      "Multi-stage quality controls and advanced testing.",
      "Modern extraction and packaging technologies.",
      "Complete batch traceability.",
      "Sustainability and workplace safety.",
    ],
  },
  {
    img: "https://res.cloudinary.com/dlsv90kui/image/upload/v1755712329/img6_qa9zer.png",
    title: "Software & AI: Driving Innovation",
    description:
      "Cutting-edge software and AI streamline our operations, elevate quality, and accelerate product innovation.",
    points: [
      "Data analytics for precise product development.",
      "Practitioner platforms for improved clinical workflows.",
      "Wearable and diagnostic integrations.",
      "Smart manufacturing and quality systems.",
    ],
  },
];

export default function OurStory() {
  return (
    <Box bg="#35b6b4" py={{ base: 16, md: 20 }}>
      <Box maxW="1200px" mx="auto" px={{ base: 4, md: 8 }}>
        {/* HEADER */}
        <Stack spacing={4} textAlign="center" mb={14}>
          <Tag
            alignSelf="center"
            bg="#026aa2"

            color="#fff"
            px={4}
            py={2}
            rounded="full"
            textTransform="uppercase"
            letterSpacing="widest"
            fontSize="sm"
          >
            Our Story
          </Tag>

          <Heading
            color="#f7f7f7"
            fontSize={{ base: "2.2rem", md: "2.8rem" }}
          >
            Stay fit. Avoid disease. Treat the root cause, not just the symptoms.
          </Heading>

          <Text maxW="720px" mx="auto" color="#745849">
            We blend ancient wisdom with modern science and nutrition
            to help people stay fit, prevent illness, and restore balance from
            the root.
          </Text>
        </Stack>

        {/* CONTENT SECTIONS */}
        <Stack spacing={16}>
          {ourStoryContent.map((item, index) => {
            const isEven = index % 2 === 0;

            return (
              <SimpleGrid
                key={item.title}
                columns={{ base: 1, md: 2 }}
                spacing={12}
                alignItems="center"
              >
                {/* IMAGE */}
                <Box order={{ base: 1, md: isEven ? 1 : 2 }}>
                  <Image
                    src={item.img}
                    alt={item.title}
                    rounded="3xl"
                    w="full"
                    objectFit="cover"
                    border="2px solid"
                    borderColor="white"
                    boxShadow="2xl"
                  />
                </Box>

                {/* TEXT */}
                <Stack
                  spacing={5}
                  order={{ base: 2, md: isEven ? 2 : 1 }}
                  bg="#f7f7f7"
                  px={{ base: 6, md: 8 }}
                  py={{ base: 8, md: 10 }}
                  rounded="3xl"
                  border="1px solid #e5e5e5"
                  boxShadow="lg"
                >
                  <Heading color="#263d21" size="lg">{item.title}</Heading>
                  <Text color="#745849">{item.description}</Text>

                  {item.points && (
                    <Stack spacing={3}>
                      {item.points.map((point) => (
                        <HStack key={point} spacing={3} align="flex-start">
                          <Icon
                            as={IoCheckbox}
                            color="#745849"
                            boxSize={5}
                            mt={1}
                          />
                          <Text color="#4a4a4a">{point}</Text>
                        </HStack>
                      ))}
                    </Stack>
                  )}
                </Stack>
              </SimpleGrid>
            );
          })}
        </Stack>
      </Box>
    </Box>
  );
}
