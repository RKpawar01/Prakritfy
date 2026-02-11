"use client"
import emailjs from "emailjs-com";
import { Button, Textarea, Portal } from "@chakra-ui/react";
import { useState } from "react";

export default function Form() {
  const [open, setOpen] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();

    emailjs
      .sendForm(
        "SERVICE_ID",
        "TEMPLATE_ID",
        e.target,
        "PUBLIC_KEY"
      )
      .then(
        () => {
          alert("Consultation request sent successfully!");
          e.target.reset();
          setOpen(false);
        },
        (error) => {
          alert("Failed to send. Try again!");
          console.error(error);
        }
      );
  };

  return (
    <>
      {/* ================= BUTTON (ALWAYS VISIBLE) ================= */}
      <Portal>
        <Button
          onClick={() => setOpen((prev) => !prev)}
          position="fixed"
          right="0"
          top="50%"
          transform="translateY(-50%)"
          h="160px"
          w="48px"
          bg="#05293c"
          color="white"
          boxShadow="xl"
          zIndex="3000"
          borderRadius="16px 0 0 16px"
          sx={{
            writingMode: "vertical-rl",
            textOrientation: "mixed",
          }}
          _hover={{ bg: "#05293c" }}
        >
          {open ? "CLOSE" : "BOOK"}
        </Button>
      </Portal>

      {/* ================= FORM (SLIDE + FADE) ================= */}
      <Portal>
        <div
          className="w-80 bg-[#026aa2] rounded-2xl p-6 shadow-xl text-white fixed bottom-0 right-0"
          style={{
            zIndex: 2999,
            transform: open ? "translateX(0)" : "translateX(120%)",
            opacity: open ? 1 : 0,
            transition: "transform 0.35s ease, opacity 0.35s ease",
            pointerEvents: open ? "auto" : "none",
          }}
        >
          {/* ===== FORM UI UNCHANGED ===== */}

          <h2 className="text-xl font-semibold text-center">
            <span className="text-lg font-bold">
              Book a Free <br />
              Consultation with Our <br />
              Doctors
            </span>
          </h2>

          <p className="text-sm text-center text-gray-200 mt-2">
            Kindly fill the required fields given below and complete to book your
            free consultation.
          </p>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="text-sm font-medium">Full Name *</label>
              <input
                type="text"
                
                name="full_name"
                placeholder="   Enter Your Name"
                style={{
    color: "black"
  }}

                required
                className="w-full bg-white rounded-full mt-1 px-4 py-2 text-black outline-none"
              />
            </div>

            <div>
              <label className="text-sm font-medium" >
                Phone Number (Whatsapp) *
              </label>
              <div className="flex items-center bg-white rounded-full mt-1 px-3">
                <span className="mr-2">🇮🇳</span>
                <input
  type="tel"
  name="phone"
  placeholder="Enter Your Number"
  required
  inputMode="numeric"
  pattern="[0-9]*"
  maxLength={10}
  style={{
    color: "black",
    caretColor: "black",
  }}
  className="w-full py-2 text-black outline-none rounded-full"
  onInput={(e) => {
    e.target.value = e.target.value.replace(/[^0-9]/g, "");
  }}
/>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Email ID </label>
              <input
                type="email"
                name="email"
                placeholder="   Enter Your Email"
                style={{
    color: "black"
  }}
                textColor="black"
                required
                className="w-full bg-white rounded-full mt-1 px-4 py-2 text-black outline-none"
              />
            </div>

            <div>
              <label className="text-sm font-medium">
                Existing Health Conditions 
              </label>
              <Textarea
                name="condition"
                placeholder="Please Let as Know"
                textColor="black"
                rows={3}
                required
                w="full"
                bg="white"
                borderRadius="2xl"
                color="black"
                resize="none"
                _focus={{ boxShadow: "none" }}
              />
            </div>

            <Button
              type="submit"
              w="full"
              bg="#2e4428"
              color="white"
              py={6}
              borderRadius="full"
              _hover={{ bg: "#e8d469", color: "black" }}
            >
              Book Free Consultation
            </Button>
          </form>
        </div>
      </Portal>
    </>
  );
}
