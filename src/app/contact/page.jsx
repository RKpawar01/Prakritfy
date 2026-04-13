"use client";
import { NavbarDemo } from "@/components/Universal/NavbarDemo";
import React, { useState } from "react";
import {
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
  FaPaperPlane,
  FaUser,
  FaCalendarAlt,
  FaCheckCircle,
  FaArrowRight,
  FaSpinner,
} from "react-icons/fa";
import { MdOutlineHealthAndSafety } from "react-icons/md";

/* ================= REUSABLE COMPONENTS ================= */

const Input = ({ label, icon, className = "", ...props }) => (
  <div className={className}>
    <label className="flex items-center gap-2 mb-2 font-medium">
      {icon} {label}
    </label>
    <input
      {...props}
      required
      className="w-full h-full bg-white/[0.04] border border-white/5 rounded-xl p-4 focus:outline-none focus:ring-1 focus:ring-cyan-400/30"
    />
  </div>
);

const Info = ({ icon, title, text }) => (
  <div className="flex gap-4 items-center">
    <div className="p-3 bg-white/10 rounded-xl">{icon}</div>
    <div>
      <div className="font-semibold">{title}</div>
      <div className="text-slate-300">{text}</div>
    </div>
  </div>
);

/* ================= PAGE ================= */

export default function PremiumContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    consultationType: "general",
    preferredDate: "",
    preferredTime: "",
    message: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 1500));

    setIsSubmitted(true);
    setFormData({
      name: "",
      phone: "",
      address: "",
      consultationType: "general",
      preferredDate: "",
      preferredTime: "",
      message: "",
    });

    setTimeout(() => setIsSubmitted(false), 4000);
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-[#061411] via-[#0b2620] to-[#4fb9a0] text-white">
      <NavbarDemo />
      {/* HEADER */}
      <section className="text-center py-20 px-4">
        <div className="text-5xl md:text-6xl font-semibold tracking-tight bg-gradient-to-r from-slate-100 to-cyan-200 bg-clip-text text-transparent">
          Contact Our Care Team
        </div>
        <div className="mt-4 max-w-2xl mx-auto text-slate-400 text-lg">
          Trusted medical guidance, delivered with precision and compassion.
        </div>
      </section>

      {/* CONTENT */}
      <section className="max-w-7xl mx-auto px-4 grid lg:grid-cols-2 gap-12 pb-20">
        {/* LEFT INFO */}
        <div className="space-y-8">
          <div className="rounded-2xl overflow-hidden shadow-[0_30px_80px_rgba(0,0,0,0.6)]">
            <img
              src="/CustomerCare-Photoroom.png"
              alt="Healthcare Support"
              className="w-full"
            />
          </div>

          <div className="bg-white/[0.06] backdrop-blur-2xl border border-white/10 rounded-2xl p-8 space-y-6">
            <Info icon={<FaPhone />} title="Phone" text="7058258025" />
            <Info
              icon={<FaEnvelope />}
              title="Email"
              text="care@prakritify.com"
            />
            {/* <Info icon={<FaMapMarkerAlt />} title="Location" text="San Francisco, CA" /> */}

            {/* <div className="bg-cyan-500/10 border border-cyan-400/20 rounded-xl p-4">
              <div className="flex items-center gap-2 font-semibold">
                <MdOutlineHealthAndSafety /> Emergency Support
              </div>
              <div className="text-sm text-slate-300 mt-1">
                Average response time under 15 minutes.
              </div>
            </div> */}
          </div>
        </div>

        {/* FORM */}
        <div className="bg-white/[0.05] backdrop-blur-2xl border border-white/10 rounded-2xl p-8 shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
          <div className="text-3xl font-semibold mb-2 text-white">Book a Consultation</div>
          <div className="text-white mb-6">
            Our specialists will contact you shortly.
          </div>

          {isSubmitted && (
            <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-400/30 rounded-xl p-4 mb-6">
              <FaCheckCircle className="text-emerald-400 text-xl" />
              <span className="text-gray-900 font-medium">Your request has been submitted successfully.</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
  
  {/* Full Name */}
  <div>
    <label className="flex items-center gap-2 mb-3.5 font-semibold text-white">
      <FaUser /> Full Name
    </label>
    <input
      name="name"
      value={formData.name}
      onChange={handleChange}
      placeholder="Enter your full name"
      required
      className="w-full py-3 bg-white text-black text-base border border-gray-300 rounded-lg placeholder-gray-400 font-medium focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all duration-200 leading-relaxed min-h-12"
      style={{ color: '#000000', paddingLeft: '16px', paddingRight: '16px' }}
    />
  </div>

  {/* Phone */}
  <div>
    <label className="flex items-center gap-2 mb-3.5 font-semibold text-white">
      <FaPhone /> Phone Number
    </label>
    <input
      name="phone"
      type="tel"
      value={formData.phone}
      onChange={handleChange}
      placeholder="Enter 10-digit number"
      required
      maxLength={10}
      className="w-full py-3 bg-white text-black text-base border border-gray-300 rounded-lg placeholder-gray-400 font-medium focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all duration-200 leading-relaxed min-h-12"
      style={{ color: '#000000', paddingLeft: '16px', paddingRight: '16px' }}
    />
  </div>

  {/* Date + Time */}
  <div className="grid grid-cols-2 gap-4">
    
    {/* Date */}
    <div>
      <label className="flex items-center gap-2 mb-3.5 font-semibold text-white">
        <FaCalendarAlt /> Preferred Date
      </label>
      <input
        type="date"
        name="preferredDate"
        value={formData.preferredDate}
        onChange={handleChange}
        min={new Date().toISOString().split("T")[0]}
        className="w-full py-3 bg-white text-black text-base border border-gray-300 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all duration-200 leading-relaxed min-h-12"
        style={{ 
          colorScheme: 'light',
          color: '#000000',
          paddingLeft: '16px',
          paddingRight: '16px',
        }}
      />
    </div>

    {/* Time */}
    <div>
      <label className="flex items-center gap-2 mb-3.5 font-semibold text-white">
        <FaCalendarAlt /> Time
      </label>
      <select
        name="preferredTime"
        value={formData.preferredTime}
        onChange={handleChange}
        className="w-full py-3 bg-white text-black text-base border border-gray-300 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all duration-200 leading-relaxed min-h-12 appearance-none cursor-pointer"
        style={{
          color: '#000000',
          paddingLeft: '16px',
          paddingRight: '16px',
        }}
      >
        <option value="" label="Select Time Slot" />
        <option value="morning">Morning 9am to 12pm</option>
        <option value="afternoon">Afternoon 12pm to 5pm</option>
        <option value="evening">Evening 5pm to 9pm</option>
      </select>
    </div>
  </div>

  {/* Notes */}
  <div>
    <label className="flex items-center gap-2 mb-3.5 font-semibold text-white">
      <FaPaperPlane /> Additional Notes
    </label>
    <textarea
      name="message"
      value={formData.message}
      onChange={handleChange}
      rows="4"
      placeholder="Share any additional details about your health condition or concerns..."
      className="w-full py-3 bg-white text-black text-base border border-gray-300 rounded-lg placeholder-gray-400 font-medium focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all duration-200 leading-relaxed resize-none"
      style={{ color: '#000000', paddingLeft: '16px', paddingRight: '16px' }}
    />
  </div>

  {/* Button */}
  <div className="flex justify-center pt-6">
    <button
      type="submit"
      disabled={isSubmitting}
      style={{
        backgroundColor: isSubmitting ? "#D1D5DB" : "#4FB9A0",
        color: isSubmitting ? "#6B7280" : "white",
      }}
      onMouseEnter={(e) => {
        if (!isSubmitting) {
          e.target.style.backgroundColor = "#FFD700";
          e.target.style.color = "black";
        }
      }}
      onMouseLeave={(e) => {
        if (!isSubmitting) {
          e.target.style.backgroundColor = "#4FB9A0";
          e.target.style.color = "white";
        }
      }}
      className={`w-60 flex items-center justify-center gap-3 px-0 py-0 rounded-full font-bold text-l transition-all duration-200 shadow-lg hover:shadow-xl min-h-16 ${
        isSubmitting ? "cursor-not-allowed" : ""
      }`}
    >
      {isSubmitting ? (
        <>
          <FaSpinner className="animate-spin" />
          Processing
        </>
      ) : (
        <>
          Book Consultation
        </>
      )}
    </button>
  </div>

</form>
        </div>
      </section>

      <footer className="text-center text-slate-500 text-xs py-6">
        © 2026 Premium Health Clinic. All rights reserved.
      </footer>
    </div>
  );
}
