"use client";

import React, { useState } from "react";

export function CardSwap({
  front,
  back,
}: {
  front: React.ReactNode;
  back: React.ReactNode;
}) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div
      className="relative w-full h-full cursor-pointer"
      style={{ perspective: "1000px" }}
      onClick={() => setFlipped(!flipped)}
    >
      <div
        className={`relative w-full h-full transition-transform duration-500 ${
          flipped ? "rotate-y-180" : ""
        }`}
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* FRONT */}
        <div className="absolute inset-0 backface-hidden">
          {front}
        </div>

        {/* BACK */}
        <div className="absolute inset-0 rotate-y-180 backface-hidden">
          {back}
        </div>
      </div>
    </div>
  );
}
