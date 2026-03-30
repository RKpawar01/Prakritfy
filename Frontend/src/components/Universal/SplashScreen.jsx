"use client";
import { useEffect } from "react";

export default function SplashScreen({ onFinish }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onFinish();
    }, 2500);

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-r from-[#2F5F55] to-[#71D2BA]  
      
    "
    >
      <img
        src="/FinalLogo.png"
        alt="Splash"
        className=" h-1/3  w-1/3  animate-splash  "
      />
    </div>
  );
}
