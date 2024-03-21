import { range } from '@/utils/range';
import { SupabaseClient } from '@supabase/supabase-js';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, Trash } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { DrawerClose } from './ui/drawer';
import { Skeleton } from './ui/skeleton';

export interface Conversation {
  id: number;
  created_at: string;
}

export default function ConversationHistory({
  supabaseClient,
  setConversationId,
}: {
  supabaseClient: SupabaseClient;
  setConversationId: (id: number) => void;
}) {
  const queryClient = useQueryClient();

  const deleteConversation = useMutation({
    mutationFn: async (conversationId: number) => {
      const allConversations = queryClient.getQueryData<Conversation[]>([
        'conversations',
      ]);
      const conversationFound = allConversations?.some(
        (conversation) => conversation.id === conversationId
      );

      if (!conversationFound) {
        throw new Error('Not found');
      }

      const { error } = await supabaseClient
        .from('conversations')
        .delete()
        .eq('id', conversationId);
      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      toast.success('Conversation deleted');
    },
    onError: (error) => {
      toast.error(`Error deleting conversation: ${error.message}`);
    },
    onSettled: async () => {
      queryClient.invalidateQueries({
        queryKey: ['conversations'],
      });
    },
  });

  const getAllConversations = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const { data, error } = await supabaseClient
        .from('conversations')
        .select('id, created_at')
        .order('created_at', { ascending: false });
      if (error) {
        throw error;
      }
      return data;
    },
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
  };

  if (
    !getAllConversations.data ||
    (getAllConversations.data && getAllConversations.data.length <= 0)
  ) {
    return (
      <div className="mr-2 space-y-4">
        {range(12).map((i) => (
          <Skeleton key={i} className="bg-muted/20 h-22 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="mr-2 space-y-2">
      {getAllConversations.data.map((conversation) => {
        return (
          <ConversationHistoryItem
            key={conversation.id}
            conversation={conversation}
            setConversationId={setConversationId}
            deleteConversation={deleteConversation}
          />
        );
      })}
    </div>
  );
}

function ConversationHistoryItem({
  conversation,
  setConversationId,
  deleteConversation,
}: {
  conversation: Conversation;
  setConversationId: (id: number) => void;
  deleteConversation: { mutate: (id: number) => void };
}) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
  };

  return (
    <div key={conversation.id} className="bg-card flex rounded-xl px-4 py-3">
      <div className="flex flex-col justify-evenly">
        <div>Conversation ID: {conversation.id}</div>
        <div className="text-sm text-gray-500">
          Created: {formatDate(conversation.created_at)}
        </div>
      </div>
      <div className="ml-auto flex flex-col gap-2">
        <DrawerClose>
          <Button
            size={'icon'}
            variant={'ghost'}
            onClick={() => setConversationId(conversation['id'])}
          >
            <ArrowRight size={20} />
          </Button>
        </DrawerClose>

        <Button
          size={'icon'}
          variant={'ghost'}
          onClick={() => deleteConversation.mutate(conversation.id)}
        >
          <Trash size={20} />
        </Button>
      </div>
    </div>
  );
}
