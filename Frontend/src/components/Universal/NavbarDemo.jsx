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
import Form from "../home/Form";
export function NavbarDemo() {
  const navItems = [
    { name: "Home", link: "/" },
    { name: "About", link: "/about" },
    { name: "Contact", link: "/contact" },
    { name: "Product", link: "/product" },

    { name: "Patient Inquiry", link: "/patient-conditions-inquiry" },
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
          <NavItems items={navItems} className="text-white font-bold text-lg" />
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
      <Form open={open} setOpen={setOpen} />
    </div>
  );
}
