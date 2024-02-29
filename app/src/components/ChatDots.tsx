export default function ChatDots({ size }: { size?: string }) {
  return (
    <div className="flex space-x-1">
      <div
        className={`bg-muted-foreground size-1 animate-[bounce_900ms_infinite_100ms] rounded-full p-1 ${size}`}
      ></div>
      <div
        className={`bg-muted-foreground size-1 animate-[bounce_900ms_infinite_200ms] rounded-full p-1 ${size}`}
      ></div>
      <div
        className={`bg-muted-foreground size-1 animate-[bounce_900ms_infinite_300ms] rounded-full p-1 ${size}`}
      ></div>
    </div>
  );
}
