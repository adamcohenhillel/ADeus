import { AnimatePresence, motion } from 'framer-motion';
import ChatDots from './ChatDots';

export interface Message {
  role: string;
  content: string;
}

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
                chat['role'] == 'user'
                  ? 'flex w-full items-end justify-end'
                  : ''
              }
            >
              <motion.div
                className={
                  chat['role'] == 'user'
                    ? 'bg-primary mb-2 w-fit rounded-xl rounded-br-none px-4 py-3 shadow-sm'
                    : 'bg-muted/20 mb-2 w-fit rounded-xl rounded-bl-none px-4 py-3 shadow-sm'
                }
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, transition: { duration: 1 } }}
              >
                <FormattedText message={chat['content']} />
              </motion.div>
            </div>
          ))}
          {waitingForResponse ? (
            <motion.div
              className="bg-muted/20 mb-2 w-fit rounded-xl rounded-bl-none px-4 py-3 shadow-sm"
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
}

const FormattedText = ({ message }: { message: string }) => {
  return (
    <>
      {message.split('\n').map((substring, index) => {
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
