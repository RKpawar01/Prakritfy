"use client";
import emailjs from "emailjs-com";
import { Button, Portal } from "@chakra-ui/react";
import { useState } from "react";

export default function Form({ open, setOpen }) {
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    email: "",
    condition: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "phone") {
      const numericValue = value.replace(/[^0-9]/g, "");
      setFormData({ ...formData, [name]: numericValue });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    emailjs.sendForm("SERVICE_ID", "TEMPLATE_ID", e.target, "PUBLIC_KEY").then(
      () => {
        alert("Consultation request sent successfully!");
        setFormData({ full_name: "", phone: "", email: "", condition: "" });
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
      {/* Toggle Button */}
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
          zIndex="3000"
          borderRadius="16px 0 0 16px"
          sx={{ writingMode: "vertical-rl" }}
        >
          {open ? "CLOSE" : "BOOK"}
        </Button>
      </Portal>

      {/* Form */}
      <Portal>
        <div
          className="fixed bottom-4 right-4 w-[90%] sm:w-96 rounded-xl p-6 shadow-2xl text-white"
          style={{
            zIndex: 2999,
            background:
              "linear-gradient(135deg, rgba(2,106,162,0.95), rgba(0,40,80,0.95))",
            transform: open
              ? "translateY(0) scale(1)"
              : "translateY(120%) scale(0.95)",
            opacity: open ? 1 : 0,
            transition: "all 0.4s cubic-bezier(0.22,1,0.36,1)",
            pointerEvents: open ? "auto" : "none",
          }}
        >
          {/* Close */}
          <button
            onClick={() => setOpen(false)}
            className="absolute top-4 right-4 text-xl"
          >
            ✕
          </button>

          <div className="text-xl font-semibold text-center mb-2">
            Book a Free Consultation
          </div>

          <p className="text-sm text-center text-gray-100 pb-5">
            Fill the details below
          </p>

          <form className="space-y-5" onSubmit={handleSubmit}>
            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-white">
                Full Name *
              </label>
              <input
                type="text"
                name="full_name"
                required
                value={formData.full_name}
                onChange={handleChange}
                placeholder="Enter your name"
                className="w-full bg-white !text-black text-[15px] font-medium leading-[1.5] pl-6 pr-5 py-3.5 rounded-md border border-gray-300 outline-none transition-all placeholder:text-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-white">
                Phone Number *
              </label>

              <div className="flex items-center gap-3 bg-white rounded-md border border-gray-300 pl-6 pr-5 py-3.5 transition-all focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
                <span className="text-black text-lg shrink-0 flex items-center">
                  🇮🇳
                </span>

                <input
                  type="text"
                  name="phone"
                  required
                  maxLength={10}
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="10 digits"
                  className="flex-1 text-[15px] !text-black font-medium leading-[1.5] outline-none bg-white placeholder:text-gray-500"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-white">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                className="w-full bg-white !text-black text-[15px] font-medium leading-[1.5] pl-6 pr-5 py-3.5 rounded-md border border-gray-300 outline-none transition-all placeholder:text-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* Condition */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-white">
                Health Condition
              </label>
              <textarea
                name="condition"
                rows={3}
                value={formData.condition}
                onChange={handleChange}
                placeholder="Enter details"
                className="w-full bg-white !text-black text-[15px] font-medium leading-[1.5] pl-6 pr-5 py-3.5 rounded-md border border-gray-300 outline-none transition-all placeholder:text-gray-500 resize-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* Button */}
            <Button
              type="submit"
              w="full"
              style={{
                backgroundColor: "#4FB9A0",
              }}
              color="white"
              py={3}
              borderRadius="md"
              fontWeight="semibold"
              _hover={{ 
                bg: "#3a9a88",
                boxShadow: "0 10px 30px rgba(79, 185, 160, 0.3)"
              }}
            >
              Book Consultation
            </Button>
          </form>
        </div>
      </Portal>
    </>
  );
}