import React, { useEffect, useState } from 'react';
import { SupabaseClient } from "@supabase/supabase-js";
import { Trash, ArrowRight } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "./ui/button";
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export interface Conversation {
    id: number;
    created_at: string;
};

export default function ConversationHistory({
    supabaseClient,
    handleClose,
    setConversationId,
}: {
    supabaseClient: SupabaseClient;
    handleClose: () => void;
    setConversationId: (id: number) => void;
}) {
    const queryClient = useQueryClient();
    
    const deleteConversation = useMutation({
        mutationFn: async (conversationId: number) => {
            const { error } = await supabaseClient
                .from("conversations")
                .delete()
                .eq("id", conversationId);
            if (error) {
                throw error;
            }
        },
        onSettled: async () => {
            queryClient.invalidateQueries({
                queryKey: ['get-all-conversations'],
            });
        },
    });

    const getAllConversations = useQuery({
        queryKey: ['get-all-conversations'],
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
        <div className="modal p-4 flex flex-col items-center justify-center">
            <Button
                onClick={() => handleClose()}
                className="mb-6 bg-muted/20 hover:bg-muted/50  py-2 px-4"
            >
                Back to Chat
            </Button>

            <AnimatePresence initial={false}>
                {getAllConversations.data && getAllConversations.data.length > 0 ? (
                    <div className="space-y-4">
                        {getAllConversations.data.map((conversation) => (
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
                                    <ArrowRight
                                        size={20}
                                        onClick={() => {
                                            setConversationId(conversation["id"]);
                                            handleClose();
                                        }}
                                    />
                                    <Trash className='mt-2' size={20} onClick={
                                        () => {
                                            deleteConversation.mutate(conversation.id);
                                        }
                                    }></Trash>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ) :  <span>Loading...</span>}
            </AnimatePresence>
        </div>
    );
};
