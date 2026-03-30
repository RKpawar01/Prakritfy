"use client";
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
          <div className="text-3xl font-semibold mb-2">Book a Consultation</div>
          <div className="text-slate-400 mb-6">
            Our specialists will contact you shortly.
          </div>

          {isSubmitted && (
            <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-400/30 rounded-xl p-4 mb-6">
              <FaCheckCircle className="text-emerald-400 text-xl" />
              <span>Your request has been submitted successfully.</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Full Name"
              icon={<FaUser />}
              name="name"
              value={formData.name}
              onChange={handleChange}
              className=" mb-5 h-10"
            />

            <Input
              label="Phone Number"
              icon={<FaPhone />}
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className=" mt-10 mb-5 h-10"
            />

            <div className="grid grid-cols-2 gap-4 mb-10 mt-10">
              <Input
                type="date"
                label="Preferred Date"
                icon={<FaCalendarAlt />}
                name="preferredDate"
                value={formData.preferredDate}
                onChange={handleChange}
                // className="p-10"
              />
              <select
                name="preferredTime"
                value={formData.preferredTime}
                onChange={handleChange}
                className="w-full bg-white/[0.04] border border-white/5 rounded-xl mt-5 mb-5 h-10"
              >
                <option className="bg-white text-blue-500" value="">
                  Select Time
                </option>
                <option className="bg-white text-blue-500" value="morning">
                  Morning
                </option>
                <option className="bg-white text-blue-500" value="afternoon">
                  Afternoon
                </option>
                <option className="bg-white text-blue-500" value="evening">
                  Evening
                </option>
              </select>
            </div>

            <textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              rows="4"
              placeholder="Additional notes"
              className="w-full bg-white/[0.04] border border-white/5 rounded-xl p-4 mt-50"
            />

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full rounded-full py-4 text-lg font-semibold transition ${
                isSubmitting
                  ? "bg-slate-700 text-slate-300"
                  : "bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 ]"
              }`}
            >
              {isSubmitting ? (
                <span className="relative z-10 flex items-center gap-3 text-emerald-100 tracking-wide">
                  <FaSpinner className="animate-spin text-lg opacity-90" />
                  <span className="font-medium">Processing</span>
                </span>
              ) : (
                <span className="relative z-10 mt-10  flex justify-center transition-transform duration-300 hover:bg-white hover:text-black hover:scale-105 h-10 rounded-4xl bg-[#061512] items-center gap-3 tracking-wide">
                  <span className="font-semibold ">Book Consultation</span>
                  <FaArrowRight className="text-white/90 transition-transform duration-300 group-hover:translate-x-1" />
                </span>
              )}
            </button>
          </form>
        </div>
      </section>

      <footer className="text-center text-slate-500 text-xs py-6">
        © 2026 Premium Health Clinic. All rights reserved.
      </footer>
    </div>
  );
}
