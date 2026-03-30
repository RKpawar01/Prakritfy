"use client";

import React from "react";
import { motion } from "framer-motion";

const Foundation = () => {
  return (
    <section className="relative h-[50vh] md:h-screen w-full overflow-hidden">
      
      {/* Background Image */}
      <img
        src="/docDesk.png"
        alt="Doctor at desk"
        className="absolute inset-0 h-screen w-full object-cover"
      />

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/40 to-transparent">
      <motion.div
        initial={{ x: 120, opacity: 0 }}
        whileInView={{ x: 0, opacity: 1 }}
        transition={{ duration: 2, ease: "easeOut", delay: 0.2 }}
        viewport={{ once: true }}
        className="
        "
      >
      <div className="text-4xl sm:ml-5 ml-15 mt-5 sm:text-4xl lg:text-8xl font-extrabold mb-2 leading-tight text-[#608e7d]">
            Our <span className="text-[#174131]">Foundation</span>
          </div>
</motion.div>
      {/* Animated Content */}
      <motion.div
        initial={{ y: 120, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        transition={{ duration: 2, ease: "easeOut", delay: 0.2 }}
        viewport={{ once: true }}
        className="
          relative z-10 flex md:h-full 
          items-start sm:items-center
          px-6 sm:px-10 lg:px-24
          pt-24 sm:pt-1
        "
      >
        {/* CONTENT */}
        <div className="w-full h-[60%] sm:w-1/2 text-white max-w-2xl">
          
          

          <p className="  leading-relaxed bg-[#608e7d]/30 backdrop-blur-md 
                         sm:p-6 rounded-2xl border border-white/20">
            With over <strong>20+ years of experience</strong> in the health and wellness industry,
            <strong> Dr. Mahesh Gupta</strong> specializes in <strong>root cause analysis</strong> of lifestyle
            disorders including Diabetes, Heart Disease, Kidney Disorders, Osteoarthritis, Osteoporosis,
            Rheumatoid Arthritis, Cancer, and Neuromuscular Conditions.
          </p>

        </div>
        
      </motion.div>
      </div>
    </section>
  );
};

export default Foundation;
