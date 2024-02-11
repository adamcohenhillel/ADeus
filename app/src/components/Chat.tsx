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
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [waitingForResponse, setWaitingForResponse] = useState(false);
  const [showConversationHistory, setShowConversationHistory] = useState(false);
  
  const sendMessageAndReceiveResponse = useMutation({
    mutationFn: async (userMessage: Message) => {
      const { data: sendMessageData, error: sendMessageError } = await supabaseClient
      .from('conversations')
      .update({ context: [...messages, userMessage] })
      .eq('id', conversationId);
      
      if (sendMessageError) throw sendMessageError;
      
      setMessages([...messages, userMessage]);
      setWaitingForResponse(true);

      const { data: aiResponseData, error: aiResponseError } = await supabaseClient.functions.invoke("chat", {
        body: { messageHistory: [...messages, userMessage] },
      });

      if (aiResponseError) throw aiResponseError;
      
      const {data: updateConversationData, error: updateConversationError} = await supabaseClient
      .from('conversations')
      .update({ context: [...messages, userMessage, aiResponseData.msg] })
      .eq('id', conversationId);
      
      if (updateConversationError) throw updateConversationError;
      
      return aiResponseData;
    },
    onError: (error) => {
      toast.error(error.message || "Unknown error");
      setWaitingForResponse(false);
    },
    onSuccess: (aiResponse) => {
      setMessages(currentMessages => {
        return [...currentMessages, aiResponse.msg as Message];
      });
      setWaitingForResponse(false);
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ['conversations', conversationId]
      });
    },
  });

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
    onMutate: () => {
      setWaitingForResponse(true);
      setMessages([]);
    },
    onError: (error) => {
      toast.error(error.message || "Unknown error");
      setWaitingForResponse(false);
    },
    onSuccess: (data) => {
      setConversationId(data[0].id);
      setWaitingForResponse(false);
    },
  })

  const getConversation = useQuery({
    queryKey: ['conversation', conversationId],
    queryFn: async () => {
      if (conversationId === null) {
        const { data, error } = await supabaseClient
          .from('conversations')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1);
        if (error) {
          throw error;
        }
        if (data && data.length === 0) {
          newConversation.mutate();
        }
        if (data && data.length > 0) {
          setConversationId(data[0].id);
        }
        return data;
      } else {
        setMessages([]);
        const { data, error } = await supabaseClient
          .from('conversations')
          .select('*')
          .eq('id', conversationId)
          .single();
        if (error) {
          throw error;
        }
        return data;
      }
    }
  })

  useEffect(() => {
    if (getConversation.data) {
      const nextMessages = getConversation.data.context;
      setMessages(nextMessages);
    }
  }, [getConversation.data]);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

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
            setConversationId={setConversationId}
          />
        ) : (
          <ChatLog
            messages={messages}
            waitingForResponse={waitingForResponse}
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
          if (!entryData.trim()) return;
          const userMessage = { role: "user", content: entryData.trim() };
          sendMessageAndReceiveResponse.mutate(userMessage);
          setEntryData("");
        }}
      />
    </>
  );
}
