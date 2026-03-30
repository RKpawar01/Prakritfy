import {
  Box,
  Button,
  Heading,
  HStack,
  Image,
  SimpleGrid,
  Stack,
  Tag,
  Text,
} from "@chakra-ui/react";

const heroProducts = [
  {
    title: "Glucose Harmony Tonic",
    description:
      "Adaptive blend of Guduchi, Vijaysar, and Berberine to stabilise glucose spikes, improve insulin response, and protect beta cells.",
    tags: ["Diabetes", "Blood sugar"],
    img: "https://images.unsplash.com/photo-1502740479091-635887520276?auto=format&fit=crop&w=800&q=80",
    price: "₹1,499",
  },
  {
    title: "Hormonal Balance Elixir",
    description:
      "Shatavari, Ashoka, and micronutrients that regulate cycles, reduce androgen dominance, and ease inflammation in PCOS.",
    tags: ["PCOS", "Hormonal health"],
    img: "https://images.squarespace-cdn.com/content/v1/5ff7311ae94c0f7fad0167ec/e746c360-9e64-43fc-9be7-ae54f129440d/Balanced+Hormones+for+a+Balanced+Life+Visit+a+Hormone+Expert.jpg",
    price: "₹1,799",
  },
  {
    title: "CardioShield Capsules",
    description:
      "Arjuna bark, Pushkarmool, and CoQ10 to strengthen cardiac output, regulate lipids, and prevent arterial plaque.",
    tags: ["Heart health", "Hypertension"],
    img: "https://images.unsplash.com/photo-1514996937319-344454492b37?auto=format&fit=crop&w=800&q=80",
    price: "₹1,299",
  },
];

function ProductShowcase() {
  return (
    <Box color="#263d21" bg="white" py={{ base: 16, md: 20 }}>
      <Box maxW="1200px" mx="auto" px={{ base: 4, md: 8 }}>
        <Stack
          direction={{ base: "column", md: "row" }}
          align={{ base: "flex-start", md: "center" }}
          justify="space-between"
          spacing={8}
          mb={12}
        >
          <Stack spacing={4} maxW="640px">
            <Text
              textTransform="uppercase"
              fontSize="sm"
              letterSpacing="widest"
              color="brand.700"
            >
              Condition kits · Clinical herbology
            </Text>
            <Heading fontSize={{ base: "2rem", md: "2.6rem" }}>
              Targeted formulations for chronic disease reversal.
            </Heading>
            <Text color="neutral.600">
              Crafted with potent botanicals and modern extraction techniques to
              jumpstart remission markers across metabolic, hormonal, hepatic, and cardiac disorders within 45 days.
            </Text>
          </Stack>
          <Button size="lg" colorScheme="accent">
            Browse Condition Kits
          </Button>
        </Stack>

        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={8}>
          {heroProducts.map((product) => (
            <Box
              key={product.title}
              border="1px solid"
              borderColor="white"
              rounded="2xl"
              overflow="hidden"
              boxShadow="2xl"
              transition="transform 0.3s ease"
              _hover={{ transform: "translateY(-8px)" }}
            >
              <Image
                src={product.img}
                alt={product.title}
                h="220px"
                w="full"
                objectFit="cover"
              />
              <Stack spacing={4} p={6}>
                <Stack spacing={3}>
                  <Heading size="md">{product.title}</Heading>
                  <Text color="neutral.600">{product.description}</Text>
                </Stack>
                <HStack spacing={2} flexWrap="wrap">
                  {product.tags.map((tag) => (
                    <Tag
                      key={tag}
                      colorScheme="green"
                      bg="#f5f8f3"
                      color="#6da95c"
                      rounded="full"
                      px={3}
                      py={1}
                    >
                      {tag}
                    </Tag>
                  ))}
                </HStack>
                <HStack justify="space-between" align="center">
                  <Text fontWeight="700" fontSize="lg" color="#263d21">
                    {product.price}
                  </Text>
                  <Button color="#fff" bg="#6da95c" fontSize="sm" rounded="full" size="sm">Add to Cart</Button>
                </HStack>
              </Stack>
            </Box>
          ))}
        </SimpleGrid>
      </Box>
    </Box>
  );
}

export default ProductShowcase;
