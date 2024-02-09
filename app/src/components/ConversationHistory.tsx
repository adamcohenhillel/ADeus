import React, { useEffect, useState } from 'react';
import { SupabaseClient } from "@supabase/supabase-js";
import { Trash, ArrowRight } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "./ui/button";

export interface Conversation {
    id: number;
    created_at: string;
};

export default function ConversationHistory({
    supabaseClient,
    handleClose,
    fetchLastConversation,
}: {
    supabaseClient: SupabaseClient;
    handleClose: () => void;
    fetchLastConversation: (conversationId: number) => void;
}) {
    const [conversations, setConversations] = useState<Conversation[]>([]);

    const removeConversation = async (conversationId: number) => {
        try {
            const { error } = await supabaseClient
                .from("conversations")
                .delete()
                .eq("id", conversationId);
        } catch (error: any) {
            console.error("ERROR", error);
        } finally {
            const { data, error } = await supabaseClient
                .from("conversations")
                .select("id, created_at")
                .order("created_at", { ascending: false });
            if (data) {
                setConversations(data);
            }
        }
    }

    useEffect(() => {
        const fetchConversationList = async () => {
            try {
                const { data, error } = await supabaseClient
                    .from("conversations")
                    .select("id, created_at")
                    .order("created_at", { ascending: false });
                if (data) {
                    setConversations(data);
                }
            } catch (error: any) {
                console.error("ERROR", error);
            }
        };
        
        fetchConversationList();
    }, [supabaseClient]);

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
                {conversations.length > 0 ? (
                    <div className="space-y-4">
                        {conversations.map((conversation) => (
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
                                    <ArrowRight size={20} onClick={() => {
                                        fetchLastConversation(conversation["id"]);
                                        handleClose();
                                    }}></ArrowRight>
                                    <Trash className='mt-2' size={20} onClick={async () => { await removeConversation(conversation["id"]) }}></Trash>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ) :  <span>Loading...</span>}
            </AnimatePresence>
        </div>
    );
};
