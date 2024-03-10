import { SendHorizontal } from 'lucide-react';
import React from 'react';
import { Button } from './ui/button';

export default function PromptForm({
  textareaRef,
  entryData,
  setEntryData,
  isDisabled,
  sendMessage,
}: {
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  entryData: string;
  setEntryData: React.Dispatch<React.SetStateAction<string>>;
  isDisabled: boolean;
  sendMessage: () => void;
}) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (entryData.trim() !== '') {
        sendMessage();
      }
    }
  };

  return (
    <div className="fixed bottom-3 flex w-full items-center justify-center">
      <div
        style={{
          height: `${textareaRef.current?.scrollHeight}px`,
        }}
        className="relative flex max-h-[200px] w-10/12 flex-col items-center justify-center"
      >
        <textarea
          ref={textareaRef}
          className="focus-visible:ring-ring ring-offset-background bg-muted/20 placeholder:text-muted-foreground/40 absolute bottom-0 left-0 max-h-[200px] w-full resize-none rounded-xl p-2 py-4 pl-[1rem] pr-[3rem] backdrop-blur-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          rows={1}
          value={entryData}
          onChange={(e) => {
            setEntryData(e.target.value);
            if (textareaRef.current) {
              textareaRef.current.style.height = 'auto';
              textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
            }
          }}
          onKeyDown={handleKeyDown}
          disabled={isDisabled}
          placeholder="What is on your mind?"
        ></textarea>
        <Button
          size={'icon'}
          className="disabled:bg-muted/40 relative bottom-0 right-2 ml-auto rounded-lg transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isDisabled || entryData.length === 0}
          onClick={sendMessage}
        >
          <SendHorizontal size={20} />
        </Button>
      </div>
    </div>
  );
}
