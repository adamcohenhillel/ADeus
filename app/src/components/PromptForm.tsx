import React from "react";
import { Button } from "./ui/button";
import { SendHorizontal } from "lucide-react";

export default function PromptForm({
  textareaRef,
  entryData,
  setEntryData,
  waitingForResponse,
  sendMessage,
}: {
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  entryData: string;
  setEntryData: React.Dispatch<React.SetStateAction<string>>;
  waitingForResponse: boolean;
  sendMessage: () => void;
}) {
  const handleSubmit = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    if (e.key === "Enter") {
      sendMessage();
    }
  };
  return (
    <div className="fixed bottom-3 w-full flex items-center justify-center">
      <div
        style={{
          height: `${textareaRef.current?.scrollHeight}px`,
        }}
        className="flex flex-col justify-center items-center w-10/12 relative max-h-[200px]"
      >
        <textarea
          ref={textareaRef}
          className="absolute bottom-0 left-0 p-2 w-full max-h-[200px] resize-none rounded-xl pl-[1rem] pr-[3rem] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background backdrop-blur-md bg-muted/20 py-4 placeholder-muted-foreground/40"
          rows={1}
          value={entryData}
          onChange={(e) => {
            setEntryData(e.target.value);
            if (textareaRef.current) {
              textareaRef.current.style.height = "auto";
              textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
            }
          }}
          disabled={waitingForResponse}
          placeholder="What is on your mind?"
        ></textarea>
        <Button
          size={"icon"}
          className="relative right-2 bottom-0 rounded-lg disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted/40 transition-colors ml-auto"
          disabled={waitingForResponse || entryData.length == 0}
          onClick={sendMessage}
        >
          <SendHorizontal size={20} />
        </Button>
      </div>
    </div>
  );
}
