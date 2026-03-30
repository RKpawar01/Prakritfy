import { Box, Button, Heading, Stack, Text } from "@chakra-ui/react";
import Form from "../home/Form";
import { useState } from "react";
function CallToAction() {
  const [open, setOpen] = useState(false);
  return (
    <Box py={{ base: 20, md: 28 }} bg="#f3e6d8">
      <Box maxW="1100px" mx="auto" px={{ base: 4, md: 8 }}>
        <Box
          rounded="3xl"
          bgGradient="linear(to-r, #2F5F55, #478576)"
          color="white"
          px={{ base: 8, md: 16 }}
          py={{ base: 14, md: 18 }}
          boxShadow="0 28px 70px rgba(0,0,0,0.18)"
        >
          <Stack
            direction={{ base: "column", md: "row" }}
            align={{ base: "flex-start", md: "center" }}
            justify="space-between"
            spacing={{ base: 10, md: 16 }}
          >
            {/* LEFT CONTENT */}
            <Stack spacing={4} maxW="620px">
              <Text
                fontSize="sm"
                letterSpacing="widest"
                textTransform="uppercase"
                color="whiteAlpha.700"
                fontWeight="600"
              >
                Start your journey
              </Text>

              <Heading
                fontSize={{ base: "1.9rem", md: "2.6rem" }}
                lineHeight="1.2"
                fontWeight="600"
              >
                A personalised plan for chronic condition management
              </Heading>

              <Text
                fontSize={{ base: "md", md: "lg" }}
                color="whiteAlpha.800"
                lineHeight="1.7"
              >
                Work 1:1 with our wellness team to identify root causes,
                interpret health markers, and build a sustainable plan tailored
                to your body and lifestyle.
              </Text>
            </Stack>

            {/* RIGHT ACTIONS */}
            <Stack
              spacing={4}
              minW={{ base: "full", md: "280px" }}
              align={{ base: "stretch", md: "flex-end" }}
            >
              <Button
                size="lg"
                rounded="full"
                bg="white"
                color="#2F5F55"
                fontWeight="600"
                px={10}
                _hover={{ bg: "#71d2ba", color: "black" }}
                onClick={() => setOpen(true)}
              >
                Book Consultation
              </Button>
              <Form open={open} setOpen={setOpen} />

              <Button
                size="lg"
                variant="ghost"
                color="whiteAlpha.800"
                cursor="text"
                fontWeight="500"
                _hover={{ bg: "whiteAlpha.100" }}
              >
                Explore wellness programs
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Box>
    </Box>
  );
}

export default CallToAction;
