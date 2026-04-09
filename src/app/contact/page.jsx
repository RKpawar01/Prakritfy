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
        <div className="bg-white/[0.05] h-[90vh] backdrop-blur-2xl border border-white/10 rounded-2xl p-8 shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
          <div className="text-3xl font-semibold mb-2 text-gray-900">Book a Consultation</div>
          <div className="text-gray-600 mb-6">
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
    <label className="flex items-center gap-2 mb-2 font-medium text-gray-900">
      <FaUser /> Full Name
    </label>
    <input
      name="name"
      value={formData.name}
      onChange={handleChange}
      required
      className="w-full px-5 py-3 bg-white !text-black border border-gray-300 rounded-md placeholder-gray-400 font-medium focus:outline-none focus:ring-2 focus:ring-cyan-400"
    />
  </div>

  {/* Phone */}
  <div>
    <label className="flex items-center gap-2 mb-2 font-medium text-gray-900">
      <FaPhone /> Phone Number
    </label>
    <input
      name="phone"
      type="tel"
      value={formData.phone}
      onChange={handleChange}
      required
      maxLength={10}
      className="w-full px-5 py-3 bg-white !text-black border border-gray-300 rounded-md placeholder-gray-400 font-medium focus:outline-none focus:ring-2 focus:ring-cyan-400"
    />
  </div>

  {/* Date + Time */}
  <div className="grid grid-cols-2 gap-4">
    
    {/* Date */}
    <div>
      <label className="flex items-center gap-2 mb-2 font-medium text-gray-900">
        <FaCalendarAlt /> Preferred Date
      </label>
      <input
        type="date"
        name="preferredDate"
        value={formData.preferredDate}
        onChange={handleChange}
        min={new Date().toISOString().split("T")[0]}
        className="w-full px-5 py-3 bg-white !text-black border border-gray-300 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-cyan-400"
      />
    </div>

    {/* Time */}
    <div>
      <label className="flex items-center gap-2 mb-2 font-medium text-gray-900">
        <FaCalendarAlt /> Time
      </label>
      <select
        name="preferredTime"
        value={formData.preferredTime}
        onChange={handleChange}
        className="w-full px-5 py-3 bg-white !text-black border border-gray-300 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-cyan-400"
      >
        <option value="" className="!text-black">Select Time</option>
        <option value="morning" className="!text-black">Morning</option>
        <option value="afternoon" className="!text-black">Afternoon</option>
        <option value="evening" className="!text-black">Evening</option>
      </select>
    </div>
  </div>

  {/* Notes */}
  <div>
    <label className="flex items-center gap-2 mb-2 font-medium text-gray-900">
      <FaPaperPlane /> Additional Notes
    </label>
    <textarea
      name="message"
      value={formData.message}
      onChange={handleChange}
      rows="4"
      placeholder="Additional notes..."
      className="w-full px-5 py-3 bg-white !text-black border border-gray-300 rounded-md placeholder-gray-400 font-medium focus:outline-none focus:ring-2 focus:ring-cyan-400 resize-none"
    />
  </div>

  {/* Button */}
  <div className="flex justify-center">
    <button
      type="submit"
      disabled={isSubmitting}
      style={{
        backgroundColor: isSubmitting ? "#9CA3AF" : "#4FB9A0",
      }}
      onMouseEnter={(e) => {
        if (!isSubmitting) e.target.style.backgroundColor = "#3a9a88";
      }}
      onMouseLeave={(e) => {
        if (!isSubmitting) e.target.style.backgroundColor = "#4FB9A0";
      }}
      className={`flex items-center gap-2 px-8 py-4 rounded font-bold text-lg transition-all shadow-lg text-white ${
        isSubmitting ? "cursor-not-allowed" : "hover:shadow-2xl"
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
          <FaArrowRight />
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
