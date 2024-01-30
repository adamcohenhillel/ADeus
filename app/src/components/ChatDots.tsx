import React from "react";

export default function ChatDots({ size }: { size?: string }) {
  return (
    <div className="space-x-1 flex">
      <div
        className={`bg-deepenRegular p-1 w-1 h-1 rounded-full animate-[bounce_900ms_infinite_100ms] ${size}`}
      ></div>
      <div
        className={`bg-deepenRegular p-1 w-1 h-1 rounded-full animate-[bounce_900ms_infinite_200ms] ${size}`}
      ></div>
      <div
        className={`bg-deepenRegular p-1 w-1 h-1 rounded-full animate-[bounce_900ms_infinite_300ms] ${size}`}
      ></div>
    </div>
  );
}
