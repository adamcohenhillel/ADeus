import { SupabaseClient } from "@supabase/supabase-js";
import { useEffect, useRef, useState } from "react";
import ChatLog, { Message } from "./ChatLog";
import LogoutButton from "./LogoutButton";
import { Button } from "./ui/button";
import { History } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import PromptForm from "./PromptForm";
import { toast } from "sonner";
import NewConversationButton from "./NewConversationButton";
import ConversationHistory from "./ConversationHistory";
import { NavMenu } from "./NavMenu";
import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import { get } from "http";

export default function Chat({
  supabaseClient,
}: {
  supabaseClient: SupabaseClient;
}) {
  const queryClient = useQueryClient()
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const [entryData, setEntryData] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState(0);
  const [waitingForResponse, setWaitingForResponse] = useState(false);
  const [showConversationHistory, setShowConversationHistory] = useState(false);

  const lastConversation = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const { data, error } = await supabaseClient
        .from("conversations")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1);
      if (error) {
        throw error;
      }
      return data;
    }
  })

  const getConversationById = useQuery({
    queryKey: ['conversations', conversationId],
    queryFn: async () => {
      const { data, error } = await supabaseClient
        .from("conversations")
        .select("*")
        .eq("id", conversationId);
      if (error) {
        throw error;
      }
      return data;
    }
  })

  const sendMessage = useMutation({
    mutationFn: async (newMessages: Message[]) => {
      const { data, error } = await supabaseClient
        .from("conversations")
        .update({ context: newMessages })
        .eq("id", conversationId);
      if (error) {
        throw error;
      }
      return data as unknown as Message[];
    },
    onSuccess: (data) => {
      setMessages(data);
    },
  })



  // const onSendMsgClick = async () => {
  //   try {
  //     let newMessages = [...messages, { role: "user", content: entryData }];
  //     setMessages(newMessages);
  //     setEntryData("");

  //     setWaitingForResponse(true);
  //     const { data: d2, error: e2 } = await supabaseClient
  //       .from("conversations")
  //       .update({ context: newMessages })
  //       .eq("id", conversationId);

  //     if (e2) {
  //       toast.error(e2.message || e2.code || "Unknown error");
  //     }

  //     const { data, error } = await supabaseClient.functions.invoke("chat", {
  //       body: { messageHistory: newMessages },
  //     });
  //     setWaitingForResponse(false);
  //     if (error) {
  //       throw error;
  //     }
  //     setMessages([...newMessages, data?.msg]);
  //   } catch (error: any) {
  //     console.error("ERROR", error);
  //     toast.error(error.message || error.code || error.msg || "Unknown error");
  //   }
  // };

  // useEffect(() => {
  //   if (messages.length > 1) {
  //     bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  //   }
  // }, [messages]);

    const newConversation = useMutation({
    mutationFn: async () => {
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
        throw error;
      }
      return data;
    },
    onSuccess: (data) => {
      setMessages(data[0].context);
      setConversationId(data[0].id);
    },
  })
  // const newConversation = async () => {
  //   try {
  //     const { data, error } = await supabaseClient
  //       .from("conversations")
  //       .insert([
  //         {
  //           context: [
  //             { role: "assistant", content: "Hey, how can I help you?" },
  //           ],
  //         },
  //       ])
  //       .select("*");
  //     if (error) {
  //       console.error("ERROR", error);
  //     }
  //     if (!data || data.length == 0) {
  //       throw new Error("No data returned");
  //     }
  //     console.log("data", data);
  //     setMessages(data[0].context);
  //     setConversationId(data[0].id);
  //   } catch (error: any) {
  //     console.error("ERROR", error);
  //     toast.error(error.message || error.code || error.msg || "Unknown error");
  //   }
  // };

  // const fetchLastConversation = async (conversationId?: number) => {
  //   try {
  //     const { data, error } = await supabaseClient
  //       .from("conversations")
  //       .select("*")
  //       .order("created_at", { ascending: false })
  //       .filter("id", conversationId ? "eq" : "not.eq", conversationId ? conversationId : 0)
  //       .limit(1);

  //     if (!data || data.length == 0 || error) {
  //       newConversation();
  //     } else {
  //       console.log("data", data);
  //       setMessages(data[0].context);
  //       setConversationId(data[0].id);
  //     }
  //   } catch (error: any) {
  //     console.error("ERROR", error);
  //     toast.error(error.message || error.code || error.msg || "Unknown error");
  //   }
  // };

  // useEffect(() => {
  //   fetchLastConversation();
  // }, []);

  return (
    <>
      <div className="h-24 bg-gradient-to-b from-background flex justify-between items-center fixed top-0 w-full"></div>

      <div className="fixed flex space-x-4 top-4 right-4">
        <NavMenu>
          <LogoutButton supabaseClient={supabaseClient} />
          <NewConversationButton
            createNewConversation={() => {
              newConversation.mutate();
            }}
          />
          <Button
            size={"icon"}
            className="rounded-full bg-muted/20 text-muted-foreground hover:bg-muted/40"
            onClick={() => {
              setShowConversationHistory(!showConversationHistory);
            }}
          >
            <History size={20} />
          </Button>
          <ThemeToggle />
        </NavMenu>
      </div>

      <div className="p-8 mt-12 mb-32">
        {showConversationHistory ? (
          <ConversationHistory
            supabaseClient={supabaseClient}
            handleClose={() => {
              setShowConversationHistory(!showConversationHistory);
            }}
            setConversationId={(id) => {
              setConversationId(id);
              getConversationById.refetch();
              setMessages(getConversationById.data?.[0].context);
              console.log("id", id);
            }}
          />
        ) : (
          <ChatLog
            messages={messages}
            isLoading={lastConversation.isLoading || getConversationById.isLoading}
          />
        )}
      </div>

      <div ref={bottomRef} />
      <PromptForm
        textareaRef={textareaRef}
        entryData={entryData}
        setEntryData={setEntryData}
        waitingForResponse={waitingForResponse}
        sendMessage={() => {
          const newMessages = [...messages, { role: "user", content: entryData }];
          sendMessage.mutate(newMessages);
        }}
      />
    </>
  );
}
