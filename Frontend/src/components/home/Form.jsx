"use client";
import emailjs from "emailjs-com";
import { Button, Textarea, Portal } from "@chakra-ui/react";
import { useState } from "react";

export default function Form({ open, setOpen }) {
  const handleSubmit = (e) => {
    e.preventDefault();

    emailjs.sendForm("SERVICE_ID", "TEMPLATE_ID", e.target, "PUBLIC_KEY").then(
      () => {
        alert("Consultation request sent successfully!");
        e.target.reset();
        setOpen(false);
      },
      (error) => {
        alert("Failed to send. Try again!");
        console.error(error);
      },
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
          className="
          fixed bottom-4 right-4
          w-[90%] sm:w-96
          bg-[#026aa2]
          rounded-2xl p-6
          shadow-xl text-white
        "
          style={{
            zIndex: 2999,
            background:
              "linear-gradient(135deg, rgba(2,106,162,0.9), rgba(0,40,80,0.9))",
            transform: open
              ? "translateY(0) scale(1)"
              : "translateY(120%) scale(0.95)",
            opacity: open ? 1 : 0,
            transition: "all 0.4s cubic-bezier(0.22,1,0.36,1)",
            pointerEvents: open ? "auto" : "none",
          }}
        >
          {/* Close Button */}
          <button
            onClick={() => setOpen(false)}
            className="absolute top-3 right-4 text-xl "
          >
            ✕
          </button>

          <div className="text-xl font-bold text-center">
            Book a Free <br /> Consultation with Our Doctors
          </div>

          <p className="text-sm text-center text-gray-200 pt-2">
            Fill the details below to book your free consultation.
          </p>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            {/* Full Name */}
            <div>
              <label className="text-sm font-medium">Full Name *</label>
              <input
                type="text"
                name="full_name"
                required
                placeholder="   Enter your name"
                className="w-full bg-white rounded-full mt-1 px-4 py-3 text-black outline-none"
              />
            </div>

            {/* Phone Number */}
            <div>
              <label className="text-sm font-medium">
                Phone Number (WhatsApp) *
              </label>
              <div className="flex items-center bg-white rounded-full mt-1 px-3">
                <span className="mr-2 text-black">🇮🇳</span>
                <input
                  type="tel"
                  name="phone"
                  required
                  maxLength={10}
                  placeholder="Enter number"
                  inputMode="numeric"
                  className="w-full py-3 text-black outline-none"
                  onInput={(e) => {
                    e.target.value = e.target.value.replace(/[^0-9]/g, "");
                  }}
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="text-sm font-medium">Email ID</label>
              <input
                type="email"
                name="email"
                placeholder="   Enter email"
                className="w-full bg-white rounded-full mt-1 px-4 py-3 text-black outline-none"
              />
            </div>

            {/* Health Condition */}
            <div>
              <label className="text-sm font-medium">
                Existing Health Conditions
              </label>
              <Textarea
                name="condition"
                rows={3}
                bg="white"
                color="black"
                borderRadius="xl"
                resize="none"
                _focus={{ boxShadow: "none" }}
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              w="full"
              bg="#71D2BA"
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
