import { SupabaseClient } from '@supabase/supabase-js';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useSupabaseConfig } from '../utils/useSupabaseConfig';
import ChatLog, { Message } from './ChatLog';
import LogoutButton from './LogoutButton';
import { NavMenu } from './NavMenu';
import NewConversationButton from './NewConversationButton';
import PromptForm from './PromptForm';
import SideMenu from './SideMenu';
import { ThemeToggle } from './ThemeToggle';

export default function Chat({
  supabaseClient,
}: {
  supabaseClient: SupabaseClient;
}) {
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const [entryData, setEntryData] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [waitingForResponse, setWaitingForResponse] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);

  const { supabaseUrl, supabaseToken } = useSupabaseConfig();

  const sendMessageAndReceiveResponse = useMutation({
    mutationFn: async (userMessage: Message) => {
      setMessages([...messages, userMessage]);
      setWaitingForResponse(true);

      // Invoke the function and get the response as a ReadableStream
      const url = `${supabaseUrl}/functions/v1/chat`;
      const headers = {
        Authorization: `Bearer ${supabaseToken}`,
        'Content-Type': 'application/json',
      };
      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          messageHistory: [...messages, userMessage],
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      if (response.body) {
        const reader = response.body.getReader();
        setWaitingForResponse(false);
        setIsStreaming(true);

        try {
          let completeResponse = '';
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunks = new TextDecoder().decode(value).split('\n');
            for (const chunk of chunks) {
              if (chunk) {
                const aiResponse = JSON.parse(chunk);
                if (aiResponse.message) {
                  completeResponse += aiResponse.message;
                  setMessages((prevMessages) => {
                    const updatedMessages = [...prevMessages];
                    const lastMessageIndex = updatedMessages.length - 1;
                    if (
                      lastMessageIndex >= 0 &&
                      updatedMessages[lastMessageIndex].role === 'assistant'
                    ) {
                      // If the last message is from the assistant, update its content
                      updatedMessages[lastMessageIndex] = {
                        ...updatedMessages[lastMessageIndex],
                        content:
                          updatedMessages[lastMessageIndex].content +
                          aiResponse.message,
                      };
                    } else {
                      // Otherwise, add a new message from the assistant
                      updatedMessages.push({
                        role: 'assistant',
                        content: aiResponse.message,
                      });
                    }
                    return updatedMessages;
                  });
                }
              }
            }

            const updatedContext = [
              ...messages,
              userMessage,
              { role: 'assistant', content: completeResponse },
            ];
            const updateResponse = await supabaseClient
              .from('conversations')
              .update({ context: updatedContext })
              .eq('id', conversationId);
            if (updateResponse.error) {
              throw updateResponse.error;
            }
          }
        } catch (error) {
          console.error('Stream reading failed', error);
          setIsStreaming(false);
          setWaitingForResponse(false);
        } finally {
          reader.releaseLock();
        }
      }
      setIsStreaming(false);
    },
  });

  const newConversation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabaseClient
        .from('conversations')
        .insert([
          {
            context: [
              { role: 'assistant', content: 'Hey, how can I help you?' },
            ],
          },
        ])
        .select('*');
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
      toast.error(error.message || 'Unknown error');
      setWaitingForResponse(false);
    },
    onSuccess: (data) => {
      setConversationId(data[0].id);
      setWaitingForResponse(false);
    },
  });

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
    },
  });

  useEffect(() => {
    if (getConversation.data) {
      const nextMessages = getConversation.data.context;
      setMessages(nextMessages);
    }
  }, [getConversation.data]);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  return (
    <>
      <div className="from-background fixed top-0 flex h-24 w-full items-center justify-between bg-gradient-to-b"></div>
      <div className="fixed left-4 top-4 flex space-x-4">
        <SideMenu
          supabaseClient={supabaseClient}
          setConversationId={setConversationId}
        />
      </div>
      <div className="fixed right-4 top-4 flex space-x-4">
        <NavMenu>
          <LogoutButton supabaseClient={supabaseClient} />
          <NewConversationButton
            createNewConversation={() => {
              newConversation.mutate();
            }}
          />
          <ThemeToggle />
        </NavMenu>
      </div>

      <div className="mb-32 mt-12 p-4 md:p-8">
        <ChatLog messages={messages} waitingForResponse={waitingForResponse} />
      </div>

      <div ref={bottomRef} />
      <PromptForm
        textareaRef={textareaRef}
        entryData={entryData}
        setEntryData={setEntryData}
        isDisabled={isStreaming || waitingForResponse}
        sendMessage={() => {
          if (!entryData.trim()) return;
          const userMessage = { role: 'user', content: entryData.trim() };
          sendMessageAndReceiveResponse.mutate(userMessage);
          setEntryData('');
        }}
      />
    </>
  );
}
