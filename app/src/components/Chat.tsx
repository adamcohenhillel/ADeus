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
import { Select } from "./ui/select";

interface Model {
  id: string;
  name: string;
}

export default function Chat({
  supabaseClient,
}: {
  supabaseClient: SupabaseClient;
}) {
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const [entryData, setEntryData] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<Message[]>([]);
  const [waitingForResponse, setWaitingForResponse] = useState(false);
  const [isOpenRouterAvailable, setIsOpenRouterAvailable] = useState(false);

  const [openRouterModels, setOpenRouterModels] = useState<Model[]>([]); // State to store model names
  const [selectedModel, setSelectedModel] = useState(""); // State to store the selected model ID
  const [showConversationHistory, setShowConversationHistory] = useState(false);

  const onSendMsgClick = async () => {
    try {
      let newMessages = [...messages, { role: "user", content: entryData }];
      setMessages(newMessages);
      setEntryData("");

      setWaitingForResponse(true);
      await supabaseClient
        .from("conversations")
        .update({ context: newMessages })
        .eq("id", conversationId);

      const { data, error } = await supabaseClient.functions.invoke("chat", {
        body: { messageHistory: newMessages, modelId: selectedModel }, // Pass the selected model ID along
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

  //fetch OpenRouter Models if OpenRouter Key Exists
  useEffect(() => {
    async function fetchOpenRouterConfig() {
      try {
        const { data } = await supabaseClient.functions.invoke(
          "get-openrouter-config",
          {
            method: "GET",
          }
        );

        if (data && data.isOpenRouterAvailable) {
          setIsOpenRouterAvailable(true);
          setOpenRouterModels(data.models);
          if (data.models.length > 0) {
            setSelectedModel(data.models[0].id);
          }
        } else {
          setIsOpenRouterAvailable(false);
        }
      } catch (error) {
        console.error("Error fetching OpenRouter config:", error);
        setIsOpenRouterAvailable(false);
      }
    }

    fetchOpenRouterConfig();
  }, []);

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
      if (!data || data.length == 0) {
        throw new Error("No data returned");
      }
      console.log("data", data);
      setMessages(data[0].context);
      setConversationId(data[0].id);
    } catch (error: any) {
      console.error("ERROR", error);
      toast.error(error.message || error.code || error.msg || "Unknown error");
    }
  };

  const fetchLastConversation = async (conversationId?: number) => {
    try {
      const { data, error } = await supabaseClient
        .from("conversations")
        .select("*")
        .order("created_at", { ascending: false })
        .filter(
          "id",
          conversationId ? "eq" : "not.eq",
          conversationId ? conversationId : 0
        )
        .limit(1);

      if (!data || data.length == 0 || error) {
        newConversation();
      } else {
        console.log("data", data);
        setMessages(data[0].context);
        setConversationId(data[0].id);
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
    <>
      <div className="h-24 bg-gradient-to-b from-background flex justify-between items-center fixed top-0 w-full"></div>

      {/* OpenRouter Model Select If OpenRouter API Key Setup */}
      <div className="fixed flex space-x-4 top-4 left-4">
        {isOpenRouterAvailable && (
          <div className="flex-grow min-w-40">
            <Select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="ml-4"
            >
              {openRouterModels.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              ))}
            </Select>
          </div>
        )}
      </div>

      <div className="fixed flex space-x-4 top-4 right-4">
        <NavMenu>
          <LogoutButton supabaseClient={supabaseClient} />
          <NewConversationButton
            createNewConversation={async () => {
              setMessages([]);
              await newConversation();
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
            fetchLastConversation={(chatId) => {
              fetchLastConversation(chatId);
            }}
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
        onSendMsgClick={onSendMsgClick}
      />
    </>
  );
}
