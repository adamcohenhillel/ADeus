import React, { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import Link from "next/link";

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { toast } from "react-toastify";
import { PiPaperPlaneRightBold } from "react-icons/pi";
import { motion, AnimatePresence } from "framer-motion";
import { MdLogout } from "react-icons/md";
import { GoPlus } from "react-icons/go";

import { useSupabase, useSupabaseConfig } from "@/utils/useSupabaseConfig";

type ConversationMessage = {
  role: string;
  content: string;
};

function ChatDots({ size }: { size?: string }) {
  return (
    <div className="space-x-1 flex">
      <div
        className={`bg-adeusRegular p-1 w-1 h-1 rounded-full animate-[bounce_900ms_infinite_100ms] ${size}`}
      ></div>
      <div
        className={`bg-adeusRegular p-1 w-1 h-1 rounded-full animate-[bounce_900ms_infinite_200ms] ${size}`}
      ></div>
      <div
        className={`bg-adeusRegular p-1 w-1 h-1 rounded-full animate-[bounce_900ms_infinite_300ms] ${size}`}
      ></div>
    </div>
  );
}
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
                    ? "bg-adeusRegular text-adeusCream rounded-xl px-4 py-3 mb-2 rounded-br-none shadow-sm w-fit"
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

function LoginComponent() {
  const router = useRouter();

  const [supabaseUrl, setSupabaseUrl] = useState("");
  const [supabaseToken, setSupabaseToken] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");

  const {
    supabaseUrl: savedUrl,
    supabaseToken: savedToken,
    setSupabaseConfig,
  } = useSupabaseConfig();

  useEffect(() => {
    if (savedUrl) {
      setSupabaseUrl(savedUrl);
    }
    if (savedToken) {
      setSupabaseToken(savedToken);
    }
  }, [savedUrl, savedToken]);

  async function EmailLogin() {
    try {
      const supabaseClient = createClient(supabaseUrl, supabaseToken);
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Login successful");
        setSupabaseConfig(supabaseUrl, supabaseToken);
        router.push("/");
      }
    } catch (error: any) {
      console.error("ERROR", error);
      toast.error(error.message || error.code || error.msg || "Unknown error");
    }
  }

  return (
    <div className="pt-safe mt-6 flex flex-col w-full p-8 bg-adeusCream">
      <h1 className="pt-4 text-2xl font-bold">Login to ADeus</h1>

      <div>
        <div className="flex flex-wrap pt-4">
          <label
            className="block text-black text-sm font-medium mb-1"
            htmlFor="text"
          >
            Supabase URL
          </label>
          <input
            id="supabaseUrl"
            placeholder={"Enter your Supabase URL"}
            type="text"
            value={supabaseUrl}
            onChange={(e) => setSupabaseUrl(e.target.value)}
            className="form-input w-full text-gray-800 h-10 border-2 rounded-md pl-2"
            required
          />
        </div>

        <div className="flex flex-wrap pt-4">
          <label
            className="block text-black text-sm font-medium mb-1"
            htmlFor="email"
          >
            Supabase Token
          </label>
          <input
            id="supabaseToken"
            placeholder={"Enter your Supabase token"}
            type="text"
            value={supabaseToken}
            onChange={(e) => setSupabaseToken(e.target.value)}
            className="form-input w-full text-gray-800 h-10 border-2 rounded-md pl-2"
            required
          />
        </div>

        <div className="flex flex-wrap pt-4">
          <label
            className="block text-black text-sm font-medium mb-1"
            htmlFor="email"
          >
            Email
          </label>
          <input
            id="email"
            placeholder={"Enter your Email"}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="form-input w-full text-gray-800 h-10 border-2 rounded-md pl-2"
            required
          />
        </div>
        <div className="flex flex-wrap pt-4">
          <label
            className="block text-black text-sm font-medium mb-1"
            htmlFor="password"
          >
            Password
          </label>
          <input
            id="password1"
            placeholder="********"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="form-input w-full text-gray-800 h-10 border-2 rounded-md pl-2"
            required
          />
        </div>

        <div className="flex flex-col items-center mt-6">
          <button
            onClick={EmailLogin}
            className="w-full flex justify-center items-center h-10 font-bold rounded-md text-white bg-black active:bg-adeusRegular shadow-sm"
          >
            nexum
          </button>
        </div>
      </div>
      <p className="mt-8 text-sm text-gray-400 pb-6 mb-safe">
        Don't have these details? Please check the setup guide{" "}
        <Link className="underline" href="https://x.com/adamcohenhillel">
          here
        </Link>
      </p>
    </div>
  );
}

function ChatComponent({ supabaseClient }: { supabaseClient: SupabaseClient }) {
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const [entryData, setEntryData] = useState("");
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [convoId, setConvoId] = useState<ConversationMessage[]>([]);
  const [waitingForResponse, setWaitingForResponse] = useState(false);
  const [numberOfLines, setNumberOfLines] = useState(1);

  const onSendMsgClick = async () => {
    try {
      let newMessages = [...messages, { role: "user", content: entryData }];
      setNumberOfLines(1);
      setMessages(newMessages);
      setEntryData("");

      setWaitingForResponse(true);
      const { data: d2, error: e2 } = await supabaseClient
        .from("conversations")
        .update({ context: newMessages })
        .eq("id", convoId);

      if (e2) {
        toast.error(e2.message || e2.code || "Unknown error");
      }

      const { data, error } = await supabaseClient.functions.invoke("chat", {
        body: { messageHistory: newMessages },
      });
      setWaitingForResponse(false);
      if (error) {
        throw error;
      }
      setMessages([...newMessages, data?.msg]);
    } catch (error: any) {
      console.error("ERROR", error);
      toast.error(error.message || error.code || error.msg || "Unknown error");
    }
  };

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

  const newConversation = async () => {
    try {
      const { data, error } = await supabaseClient
        .from("conversations")
        .insert([
          {
            context: [
              { role: "assistant", content: "Hey, how can I help you?" },
            ],
          },
        ])
        .select("*");
      if (error) {
        console.error("ERROR", error);
      }
      console.log("data", data);
      setMessages(data[0].context);
      setConvoId(data[0].id);
    } catch (error: any) {
      console.error("ERROR", error);
      toast.error(error.message || error.code || error.msg || "Unknown error");
    }
  };

  const fetchLastConversation = async () => {
    try {
      const { data, error } = await supabaseClient
        .from("conversations")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1);

      if (!data || data.length == 0 || error) {
        newConversation();
      } else {
        console.log("data", data);
        setMessages(data[0].context);
        setConvoId(data[0].id);
      }
    } catch (error: any) {
      console.error("ERROR", error);
      toast.error(error.message || error.code || error.msg || "Unknown error");
    }
  };

  useEffect(() => {
    fetchLastConversation();
  }, []);

  return (
    <div className="bg-adeusCream bg-opacity-20 overflow-y-scroll">
      {/* TOP BAR */}
      <div className="pt-safe h-24 bg-gradient-to-b from-adeusCream flex justify-between items-center fixed top-0 left-0 right-0"></div>
      <div className="fixed flex space-x-4 top-0 right-0 mt-safe p-2">
        <div
          className="w-8 h-8 bg-adeusCream rounded-full items-center flex justify-center cursor-pointer z-10 drop-shadow-lg"
          onClick={async () => await supabaseClient.auth.signOut()}
        >
          <MdLogout />
        </div>
        <div
          className="w-8 h-8 bg-adeusCream rounded-full items-center flex justify-center cursor-pointer z-10 drop-shadow-lg"
          onClick={async () => {
            setMessages([]);
            await newConversation();
          }}
        >
          <GoPlus />
        </div>
      </div>

      <div className="pt-safe p-8 mt-12 mb-32">
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
            className="p-2 w-full text-base items-center rounded-xl bg-transparent focus:border-adeusRegular "
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
            className="bg-adeusDark active:bg-adeusRegular rounded-xl shadow-sm shadow-adeusDark w-9 h-9 px-2 text-lg text-adeusCream flex items-center justify-center disabled:bg-gray-400 disabled:text-gray-600 disabled:shadow-none disabled:cursor-not-allowed"
          >
            <PiPaperPlaneRightBold size={40} />
          </button>
        </nav>
      </div>
    </div>
  );
}

export default function Index() {
  const [loggedIn, setLoggedIn] = useState(false);

  const { user, supabaseClient } = useSupabase();

  useEffect(() => {
    if (user) {
      setLoggedIn(true);
    } else {
      setLoggedIn(false);
    }
  }, [user]);

  return (
    <>
      {loggedIn && user ? (
        <ChatComponent supabaseClient={supabaseClient} />
      ) : (
        <LoginComponent />
      )}
    </>
  );
}
