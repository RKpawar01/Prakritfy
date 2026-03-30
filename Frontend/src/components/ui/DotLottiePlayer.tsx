"use client";

import React, { useRef } from "react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

interface Props {
  src: string;
  autoplay?: boolean;
  loop?: boolean;
  className?: string;
}

export default function DotLottiePlayer({
  src,
  autoplay = true,
  loop = true,
  className,
}: Props) {
  const lottieRef = useRef<any>(null);

  return (
    <DotLottieReact
      src={src}
      autoplay={autoplay}
      loop={loop}
      className={className}
      dotLottieRefCallback={(instance) => {
        lottieRef.current = instance;
      }}
    />
  );
}
