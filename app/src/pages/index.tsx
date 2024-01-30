import React, { useState, useRef, useEffect, useCallback } from "react";

import { toast } from "react-toastify";

import { PiPaperPlaneRightBold } from "react-icons/pi";
import { useSupabaseClient } from "@/utils/useSupabaseConfig";
// import { useSupabaseClient } from "@supabase/auth-helpers-react";

import { motion, AnimatePresence } from "framer-motion";

import ChatDots from "@/components/ChatDots";
import LoginRequired from "@/components/loginRequired";

type ConversationMessage = {
  role: string;
  content: string;
};

const FormatedMessageForDisplay = ({ message }: { message: string }) => {
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

const JournalingChat = ({
  data,
  waitingForResponse,
}: {
  data: ConversationMessage[];
  waitingForResponse: boolean;
}) => {
  return (
    <AnimatePresence initial={false}>
      {data ? (
        <ol className="pb-4">
          {data.map((chat, index) => (
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
                    ? "bg-deepenRegular text-deepenCream rounded-xl px-4 py-3 mb-2 rounded-br-none shadow-sm w-fit"
                    : "bg-white rounded-xl rounded-bl-none px-4 py-3 mb-2 shadow-sm w-fit"
                }
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, transition: { duration: 1 } }}
              >
                <FormatedMessageForDisplay message={chat["content"]} />
              </motion.div>
            </div>
          ))}
          {waitingForResponse ? (
            <motion.div
              className="bg-white rounded-xl rounded-bl-none px-4 py-3 mb-2 shadow-sm  w-fit"
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

export default function ChatPage() {
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const supabaseClient = useSupabaseClient();

  const [entryData, setStateEntryData] = useState("");
  const entryDataRef = useRef<string>("");
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [waitingForResponse, setWaitingForResponse] = useState(false);
  const [numberOfLines, setNumberOfLines] = useState(1);

  const sendMsgRef = useRef<() => {}>();

  const setEntryData = (value: string) => {
    setStateEntryData(value);
    entryDataRef.current = value;
  };

  const getReply = async (convoMessages: ConversationMessage[]) => {
    setWaitingForResponse(true);
    const { data, error } = await supabaseClient.functions.invoke("chat", {
      body: { messageHistory: convoMessages },
    });
    setWaitingForResponse(false);
    if (error) {
      toast.error(error);
      return;
    }
    setMessages([...convoMessages, data?.msg]);
  };

  const onSendMsgClick = useCallback(
    async (message?: string) => {
      if (!message) message = entryData;
      let newMessages = [...messages, { role: "user", content: message }];
      setNumberOfLines(1);
      setMessages(newMessages);
      setEntryData("");
      await getReply(newMessages);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [entryData, messages]
  );

  useEffect(() => {
    sendMsgRef.current = onSendMsgClick;
  }, [onSendMsgClick, entryData]);

  const adjustNumRows = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto"; // Reset height
      const { scrollHeight, clientHeight } = textarea;
      const rows = Math.ceil(scrollHeight / 30);
      if (rows < 6) setNumberOfLines(rows);
    }
  };

  useEffect(() => {
    if (messages.length > 1) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages]);

  return (
    <LoginRequired>
      <div className="bg-deepenCream bg-opacity-20 overflow-y-scroll">
        {/* TOP BAR */}
        <div className="pt-safe h-24 bg-gradient-to-b from-deepenCream flex justify-between items-center fixed top-0 left-0 right-0"></div>

        <div className="pt-safe p-8 mt-12 mb-32">
          <div
            className="bg-black p-8 text-white"
            onClick={async () => {
              console.log("Clicked");
              await supabaseClient.auth.signOut();
            }}
          >
            Logout
          </div>
          <JournalingChat
            data={messages}
            waitingForResponse={waitingForResponse}
          />
        </div>

        <div ref={bottomRef}>.</div>

        {/* Bottom Nav */}
        <div className="flex flex-col justify-center items-center w-full fixed mb-safe bottom-3 mb-4 mx-2 ">
          <nav
            style={{ height: `${3.5 + (numberOfLines - 1) * 1.5}rem` }}
            className="flex flex-row items-center justify-between space-x-4 px-2 w-4/5  rounded-xl bg-opacity-20 backdrop-blur-md bg-white shadow-[0_0px_5px_5px_rgba(0,0,0,0.1)]"
          >
            <textarea
              ref={textareaRef}
              className="p-2 w-full text-base items-center rounded-xl bg-transparent  focus:border-deepenRegular "
              id="textareaID"
              dir="auto"
              rows={numberOfLines}
              value={entryData}
              onChange={(e) => {
                setEntryData(e.target.value);
                adjustNumRows();
              }}
              disabled={waitingForResponse}
              placeholder={messages.length <= 1 ? "What is on your mind?" : ""}
            ></textarea>
            <button
              disabled={waitingForResponse || entryData.length == 0}
              onClick={() => onSendMsgClick()}
              className="bg-deepenDark active:bg-deepenRegular max-w-2 rounded-xl shadow-sm shadow-deepenDark w-9 h-9 px-2 text-lg text-deepenCream flex items-center justify-center disabled:bg-gray-400 disabled:text-gray-600 disabled:shadow-none disabled:cursor-not-allowed"
            >
              <PiPaperPlaneRightBold size={20} />
            </button>
          </nav>
        </div>
      </div>
    </LoginRequired>
  );
}
