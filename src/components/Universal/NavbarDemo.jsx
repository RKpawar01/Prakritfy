"use client";

import {
  Navbar,
  NavBody,
  NavItems,
  MobileNav,
  NavbarLogo,
  NavbarButton,
  MobileNavHeader,
  MobileNavToggle,
  MobileNavMenu,
} from "@/components/ui/resizable-navbar";

import { useState } from "react";
import { Button, Textarea } from "@chakra-ui/react";

export function NavbarDemo() {
  const navItems = [
    { name: "Home", link: "/" },
    { name: "About", link: "/about" },
    { name: "Contact", link: "/contact" },
    { name: "Product", link: "/product" },
  ];

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [open, setOpen] = useState(false);

  function book() {
    setOpen(true);
  }

  function handleSubmit(e) {
    e.preventDefault();
    alert("Form submitted successfully!");
    setOpen(false);
  }

  return (
    <div className="relative w-full">
      {/* ================= NAVBAR ================= */}
      <Navbar>
        {/* Desktop Navigation */}
        <NavBody>
          <NavbarLogo />
          <NavItems
            items={navItems}
            className="text-white font-bold text-lg"
          />
          <NavbarButton className="text-white" onClick={book} variant="primary">
            Book a call
          </NavbarButton>
        </NavBody>

        {/* Mobile Navigation */}
        <MobileNav>
          <MobileNavHeader>
            <NavbarLogo />
            <MobileNavToggle
              isOpen={isMobileMenuOpen}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            />
          </MobileNavHeader>

          <MobileNavMenu
          
              
  className="bg-[#71d2ba]/50 "
        
            isOpen={isMobileMenuOpen} 
            onClose={() => setIsMobileMenuOpen(false)}
          >
            {navItems.map((item, idx) => (
              <div className="text-black text-center rounded-4xl hover:font-bold transition-transform duration-300 hover:scale-105  hover:bg-white  w-30">
                <a
                key={idx}
                href={item.link}
                onClick={() => setIsMobileMenuOpen(false)}
                className=" text-black-700 dark:text-black"
              >
                {item.name}
              </a>
              </div>
            ))}

            <div className="flex flex-col gap-4 mt-4 hover:bg-white text-black rounded-lg">
              

              <NavbarButton
                variant="primary"
                className="w-full  "
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setOpen(true);
                }}
              >
                Book a call
              </NavbarButton>
            </div>
          </MobileNavMenu>
        </MobileNav>
      </Navbar>

      {/* ================= POPUP FORM ================= */}
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
          transform: open ? "translateY(0)" : "translateY(120%)",
          opacity: open ? 1 : 0,
          transition: "transform 0.35s ease, opacity 0.35s ease",
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

        <h2 className="text-xl font-semibold text-center">
          Book a Free <br /> Consultation with Our Doctors
        </h2>

        <p className="text-sm text-center text-gray-200 mt-2">
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
              <span className="mr-2">🇮🇳</span>
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
    </div>
  );
}
