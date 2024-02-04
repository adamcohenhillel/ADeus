import { ThemeProvider } from "@/components/ThemeProvider";
import "@/styles/globals.css";
import type { AppProps } from "next/app";

import React from "react";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <Component {...pageProps} />
      <ToastContainer
        style={{ paddingTop: "env(safe-area-inset-top, 32px)" }}
      />
    </ThemeProvider>
  );
}
