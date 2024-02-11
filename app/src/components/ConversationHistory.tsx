import React, { useEffect, useState } from 'react';
import { SupabaseClient } from "@supabase/supabase-js";
import { Trash, ArrowRight } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Skeleton } from './ui/skeleton';
import { range } from '@/utils/range';
import { DrawerClose } from './ui/drawer';

export interface Conversation {
  id: number;
  created_at: string;
};

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
      const allConversations = queryClient.getQueryData<Conversation[]>(['conversations']);
      const conversationFound = allConversations?.some((conversation) => conversation.id === conversationId);

      if (!conversationFound) {
        throw new Error("Not found");
      }
      
      const { error } = await supabaseClient
        .from("conversations")
        .delete()
        .eq("id", conversationId);
      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      toast.success("Conversation deleted");
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
        .from("conversations")
        .select("id, created_at")
        .order("created_at", { ascending: false });
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
      <div className="space-y-4 overflow-auto max-h-[80vh] pr-2">
        {getAllConversations.data && getAllConversations.data.length > 0 ? (
            getAllConversations.data.map((conversation) => (
              <motion.div
                key={conversation.id}
                className="card flex bg-muted/20 rounded-xl px-4 py-3 mb-2 shadow-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="flex flex-col justify-between">
                  <div>ID: {conversation.id}</div>
                  <div className="text-sm text-gray-500">Created: {formatDate(conversation.created_at)}</div>
                </div>
                <div className="flex flex-col justify-center items-center pl-10">
                  <DrawerClose>
                    <ArrowRight size={20} onClick={() => setConversationId(conversation["id"])} />
                  </DrawerClose>
                  <Trash className='mt-2' size={20} onClick={() => deleteConversation.mutate(conversation.id)} />
                </div>
              </motion.div>
            ))
        ) : range(6).map((i) => <ItemSkeleton key={i} />)}
      </div>
    </AnimatePresence>
  );
};

function ItemSkeleton() {
  return (
    <Skeleton className="card flex bg-muted/20 rounded-xl px-4 py-3 mb-2 shadow-sm gap-8">
      <div className="flex flex-col gap-2 justify-between">
        <Skeleton className="w-[20vw] h-4" />
        <Skeleton className="w-[20vw] h-4" />
      </div>
      <div className="flex flex-col justify-center gap-2 items-center ml-auto">
        <Skeleton className="w-[20px] h-[20px]" />
        <Skeleton className="w-[20px] h-[20px]" />
      </div>
    </Skeleton>
  )
}