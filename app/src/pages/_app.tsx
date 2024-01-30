import "@/styles/globals.css";
import type { AppProps } from "next/app";

import React from "react";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Component {...pageProps} />
      <ToastContainer
        style={{ paddingTop: "env(safe-area-inset-top, 32px)" }}
      />
    </>
  );
}
