import { range } from '@/utils/range';
import { SupabaseClient } from '@supabase/supabase-js';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Trash } from 'lucide-react';
import { toast } from 'sonner';
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

  return (
    <AnimatePresence initial={false}>
      <div className="max-h-[80vh] space-y-4 overflow-auto pr-2">
        {getAllConversations.data && getAllConversations.data.length > 0
          ? getAllConversations.data.map((conversation) => (
              <motion.div
                key={conversation.id}
                className="card bg-muted/20 mb-2 flex rounded-xl px-4 py-3 shadow-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="flex flex-col justify-between">
                  <div>ID: {conversation.id}</div>
                  <div className="text-sm text-gray-500">
                    Created: {formatDate(conversation.created_at)}
                  </div>
                </div>
                <div className="flex flex-col items-center justify-center pl-10">
                  <DrawerClose>
                    <ArrowRight
                      size={20}
                      onClick={() => setConversationId(conversation['id'])}
                    />
                  </DrawerClose>
                  <Trash
                    className="mt-2"
                    size={20}
                    onClick={() => deleteConversation.mutate(conversation.id)}
                  />
                </div>
              </motion.div>
            ))
          : range(6).map((i) => <ItemSkeleton key={i} />)}
      </div>
    </AnimatePresence>
  );
}

function ItemSkeleton() {
  return (
    <Skeleton className="card bg-muted/20 mb-2 flex gap-8 rounded-xl px-4 py-3 shadow-sm">
      <div className="flex flex-col justify-between gap-2">
        <Skeleton className="h-4 w-[20vw]" />
        <Skeleton className="h-4 w-[20vw]" />
      </div>
      <div className="ml-auto flex flex-col items-center justify-center gap-2">
        <Skeleton className="size-[20px]" />
        <Skeleton className="size-[20px]" />
      </div>
    </Skeleton>
  );
}
