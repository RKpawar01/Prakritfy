import {
  Box,
  Button,
  Heading,
  HStack,
  Image,
  SimpleGrid,
  Stack,
  Text,
  Tag,
} from "@chakra-ui/react";

const blogPosts = [
  {
    title: "Understanding the gut-skin axis through Ayurveda",
    excerpt:
      "How balancing pitta can transform chronic acne, eczema, and dullness in under two months.",
    img: "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?auto=format&fit=crop&w=900&q=80",
    category: "Skin health",
    date: "Jan 4, 2025",
  },
  {
    title: "The art of circadian nourishment",
    excerpt:
      "Align your meals with Ayurvedic chronobiology to stabilize metabolism and sleep cycles.",
    img: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=900&q=80",
    category: "Lifestyle",
    date: "Dec 18, 2024",
  },
  {
    title: "Adaptogenic herbs for stress resilience",
    excerpt:
      "Ashwagandha, Jatamansi, and Brahmi protocols for high-performing professionals.",
    img: "https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=900&q=80",
    category: "Nervous system",
    date: "Nov 30, 2024",
  },
];

function BlogHighlights() {
  return (
    <Box bg="neutral.50" py={{ base: 16, md: 20 }}>
      <Box maxW="1200px" mx="auto" px={{ base: 4, md: 8 }}>
        <Stack
          direction={{ base: "column", md: "row" }}
          align={{ base: "flex-start", md: "center" }}
          justify="space-between"
          spacing={6}
          mb={12}
        >
          <Stack spacing={3}>
            <Text
              textTransform="uppercase"
              fontSize="sm"
              letterSpacing="widest"
              color="brand.700"
            >
              Wellness journal
            </Text>
            <Heading fontSize={{ base: "2rem", md: "2.4rem" }}>
              Rituals, recipes, and research to inspire everyday healing.
            </Heading>
          </Stack>
          <Button size="lg" variant="outline">
            Explore All Articles
          </Button>
        </Stack>

        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={10}>
          {blogPosts.map((post) => (
            <Stack
              key={post.title}
              spacing={4}
              bg="white"
              border="1px solid"
              borderColor="neutral.100"
              rounded="2xl"
              overflow="hidden"
              boxShadow="lg"
              transition="transform 0.3s ease"
              _hover={{ transform: "translateY(-8px)" }}
            >
              <Image
                src={post.img}
                alt={post.title}
                h="200px"
                w="full"
                objectFit="cover"
              />
              <Stack spacing={4} p={6}>
                <HStack spacing={3}>
                  <Tag
                    bg="brand.50"
                    color="brand.700"
                    rounded="full"
                    px={3}
                    py={1}
                  >
                    {post.category}
                  </Tag>
                  <Text fontSize="sm" color="neutral.500">
                    {post.date}
                  </Text>
                </HStack>
                <Heading size="md">{post.title}</Heading>
                <Text color="neutral.600">{post.excerpt}</Text>
                <Button alignSelf="flex-start" variant="ghost" rightIcon={<span>→</span>}>
                  Read Story
                </Button>
              </Stack>
            </Stack>
          ))}
        </SimpleGrid>
      </Box>
    </Box>
  );
}

export default BlogHighlights;
