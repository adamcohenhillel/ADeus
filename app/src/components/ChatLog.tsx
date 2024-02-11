import { AnimatePresence, motion } from "framer-motion";
import ChatDots from "./ChatDots";

export interface Message {
  role: string;
  content: string;
};

export default function ChatLog({
  messages,
  waitingForResponse,
}: {
  messages: Message[];
  waitingForResponse: boolean;
}) {
  return (
    <AnimatePresence initial={false}>
      {messages ? (
        <ol className="pb-4">
          {messages.map((chat, index) => (
            <div
              key={index}
              className={
                chat["role"] == "user"
                  ? "w-full flex justify-end items-end"
                  : ""
              }
            >
              <motion.div
                className={
                  chat["role"] == "user"
                    ? "bg-primary rounded-xl px-4 py-3 mb-2 rounded-br-none shadow-sm w-fit"
                    : "bg-muted/20 rounded-xl rounded-bl-none px-4 py-3 mb-2 shadow-sm w-fit"
                }
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, transition: { duration: 1 } }}
              >
                <FormattedText message={chat["content"]} />
              </motion.div>
            </div>
          ))}
          {waitingForResponse ? (
            <motion.div
              className="bg-muted/20 rounded-xl rounded-bl-none px-4 py-3 mb-2 shadow-sm w-fit"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, transition: { duration: 1 } }}
            >
              <ChatDots />
            </motion.div>
          ) : null}
        </ol>
      ) : null}
    </AnimatePresence>
  );
};

const FormattedText = ({ message }: { message: string }) => {
  return (
    <>
      {message.split("\n").map((substring, index) => {
        return (
          <span key={index}>
            {substring}
            <br />
          </span>
        );
      })}
    </>
  );
};