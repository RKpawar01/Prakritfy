"use client";
import { Portal, Button } from "@chakra-ui/react";
import { useState } from "react";
import {
  FaPhone,
  FaUser,
  FaCalendarAlt,
  FaPaperPlane,
  FaCheckCircle,
  FaSpinner,
} from "react-icons/fa";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export default function Form({ open, setOpen }) {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    preferredDate: "",
    preferredTime: "",
    message: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "phone") {
      const numericValue = value.replace(/[^0-9]/g, "");
      setFormData({ ...formData, [name]: numericValue });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      // Add booking to Firestore
      const bookingsCollection = collection(db, "consultationBookings");
      await addDoc(bookingsCollection, {
        fullName: formData.name,
        phoneNumber: formData.phone,
        preferredDate: formData.preferredDate,
        preferredTime: formData.preferredTime,
        notes: formData.message,
        submittedAt: serverTimestamp(),
        status: "pending"
      });

      setIsSubmitted(true);
      setFormData({
        name: "",
        phone: "",
        preferredDate: "",
        preferredTime: "",
        message: "",
      });

      setTimeout(() => setIsSubmitted(false), 4000);
    } catch (error) {
      console.error("Error submitting form:", error);
      alert("Failed to submit. Please try again!");
    } finally {
      setIsSubmitting(false);
    }
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
          sx={{ 
            writingMode: "vertical-rl",
            _hover: {
              bg: "#FFD700",
              color: "black",
              transition: "all 0.3s ease"
            }
          }}
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
            background: "linear-gradient(135deg, rgba(2,106,162,0.95), rgba(0,40,80,0.95))",
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
            className="absolute top-4 right-4 text-xl hover:text-blue-400 transition"
          >
            ✕
          </button>

          <div className="text-2xl font-semibold mb-2 text-white">
            Book a Consultation
          </div>
          <p className="text-slate-300 mb-6">
            Our specialists will contact you shortly.
          </p>

          {isSubmitted && (
            <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-400/30 rounded-xl p-4 mb-6">
              <FaCheckCircle className="text-emerald-400 text-lg flex-shrink-0" />
              <span className="text-emerald-300 font-medium text-sm">Your request has been submitted successfully.</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="flex items-center gap-2 mb-2 font-semibold text-white text-sm">
                <FaUser className="text-cyan-400" /> Full Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your full name"
                required
                className="w-full py-12 bg-white text-black text-base border border-gray-300 rounded-lg placeholder-gray-400 font-medium focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all"
                style={{ paddingLeft: '16px', paddingRight: '16px', color: '#000000', minHeight: '60px' }}
              />
            </div>

            {/* Phone */}
            <div>
              <label className="flex items-center gap-2 mb-2 font-semibold text-white text-sm">
                <FaPhone className="text-cyan-400" /> Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="10-digit number"
                required
                maxLength={10}
                className="w-full py-12 bg-white text-black text-base border border-gray-300 rounded-lg placeholder-gray-400 font-medium focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all"
                style={{ paddingLeft: '16px', paddingRight: '16px', color: '#000000', minHeight: '60px' }}
              />
            </div>

            {/* Date + Time */}
            <div className="grid grid-cols-2 gap-3">
              {/* Date */}
              <div>
                <label className="flex items-center gap-2 mb-2 font-semibold text-white text-sm">
                  <FaCalendarAlt className="text-cyan-400 text-xs" /> Date
                </label>
                <input
                  type="date"
                  name="preferredDate"
                  value={formData.preferredDate}
                  onChange={handleChange}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full py-12 bg-white text-black text-base border border-gray-300 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all"
                  style={{
                    colorScheme: 'light',
                    color: '#000000',
                    paddingLeft: '16px',
                    paddingRight: '16px',
                    minHeight: '60px',
                  }}
                />
              </div>

              {/* Time */}
              <div>
                <label className="flex items-center gap-2 mb-2 font-semibold text-white text-sm">
                  <FaCalendarAlt className="text-cyan-400 text-xs" /> Time
                </label>
                <select
                  name="preferredTime"
                  value={formData.preferredTime}
                  onChange={handleChange}
                  className="w-full py-12 bg-white text-black text-base border border-gray-300 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all appearance-none cursor-pointer"
                  style={{
                    color: '#000000',
                    paddingLeft: '16px',
                    paddingRight: '16px',
                    minHeight: '60px',
                  }}
                >
                  <option value="">Select Time</option>
                  <option value="morning">Morning 9am-12pm</option>
                  <option value="afternoon">Afternoon 12pm-5pm</option>
                  <option value="evening">Evening 5pm-9pm</option>
                </select>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="flex items-center gap-2 mb-2 font-semibold text-white text-sm">
                <FaPaperPlane className="text-cyan-400 text-xs" /> Notes
              </label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                rows="5"
                placeholder="Share any health details..."
                className="w-full py-6 bg-white text-black text-base border border-gray-300 rounded-lg placeholder-gray-400 font-medium focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all resize-none"
                style={{ paddingLeft: '12px', paddingRight: '12px', color: '#000000' }}
              />
            </div>

            {/* Button */}
            <div className="flex justify-center pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  backgroundColor: isSubmitting ? "#D1D5DB" : "#4FB9A0",
                  color: isSubmitting ? "#6B7280" : "white",
                  minHeight: "60px",
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
                className={`w-full flex items-center justify-center gap-2 px-4 py-16 rounded-full font-semibold text-base transition-all duration-200 shadow-lg hover:shadow-xl ${
                  isSubmitting ? "cursor-not-allowed" : ""
                }`}
              >
                {isSubmitting ? (
                  <>
                    <FaSpinner className="animate-spin text-sm" />
                    Processing
                  </>
                ) : (
                  "Book Consultation"
                )}
              </button>
            </div>
          </form>
        </div>
      </Portal>
    </>
  );
}