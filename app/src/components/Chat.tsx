import { SupabaseClient } from '@supabase/supabase-js';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
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

  const sendMessageAndReceiveResponse = useMutation({
    mutationFn: async (userMessage: Message) => {
      const { data: sendMessageData, error: sendMessageError } =
        await supabaseClient
          .from('conversations')
          .update({ context: [...messages, userMessage] })
          .eq('id', conversationId);

      if (sendMessageError) throw sendMessageError;

      setMessages([...messages, userMessage]);
      setWaitingForResponse(true);

      const { data: aiResponseData, error: aiResponseError } =
        await supabaseClient.functions.invoke('chat', {
          body: { messageHistory: [...messages, userMessage] },
        });

      if (aiResponseError) throw aiResponseError;

      const { data: updateConversationData, error: updateConversationError } =
        await supabaseClient
          .from('conversations')
          .update({ context: [...messages, userMessage, aiResponseData.msg] })
          .eq('id', conversationId);

      if (updateConversationError) throw updateConversationError;

      return aiResponseData;
    },
    onError: (error) => {
      toast.error(error.message || 'Unknown error');
      setWaitingForResponse(false);
    },
    onSuccess: (aiResponse) => {
      setMessages((currentMessages) => {
        return [...currentMessages, aiResponse.msg as Message];
      });

      setWaitingForResponse(false);
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

      <div className="mb-32 mt-12 p-8">
        <ChatLog messages={messages} waitingForResponse={waitingForResponse} />
      </div>

      <div ref={bottomRef} />
      <PromptForm
        textareaRef={textareaRef}
        entryData={entryData}
        setEntryData={setEntryData}
        waitingForResponse={waitingForResponse}
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
