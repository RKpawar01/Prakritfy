"use client";

import { useState } from "react";

type Toast = {
  title?: string;
  description?: string;
};

let listeners: ((toast: Toast) => void)[] = [];

export function toast(data: Toast) {
  listeners.forEach((listener) => listener(data));
}

export function useToast() {
  const [toastData, setToastData] = useState<Toast | null>(null);

  const showToast = (data: Toast) => {
    setToastData(data);
    setTimeout(() => setToastData(null), 3000);
  };

  listeners.push(showToast);

  return {
    toast: showToast,
    toastData,
  };
}
