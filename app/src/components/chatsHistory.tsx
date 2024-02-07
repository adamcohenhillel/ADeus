import React, { useEffect, useState } from 'react';
import { SupabaseClient } from "@supabase/supabase-js";
import { Trash, ArrowRight } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "./ui/button";

export interface HistoryChat {
    id: number;
    created_at: string;
};

export default function ChatsHistory({
    supabaseClient,
    handleClose,
    fetchLastConversation,
}: {
    supabaseClient: SupabaseClient;
    handleClose: () => void;
    fetchLastConversation: (chatId: number) => void;
}) {
    const [listReceived, setListReceived] = useState(false);
    const [chatsList, setChats] = useState<HistoryChat[]>([]);

    const fetchChatsList = async () => {
        try {
            const { data, error } = await supabaseClient
                .from("conversations")
                .select("id, created_at")
                .order("created_at", { ascending: false });
            if (data) {
                setChats(data);
            }
        } catch (error: any) {
            console.error("ERROR", error);
        }
    };

    const removeChat = async (chatId: number) => {
        try {
            const { data, error } = await supabaseClient
                .from("conversations")
                .delete()
                .eq("id", chatId);
            if (data) {
                setChats(data);
            }
        } catch (error: any) {
            console.error("ERROR", error);
        }
        await fetchChatsList();
    }

    useEffect(() => {
        fetchChatsList();
    }, []);

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
                {chatsList.length > 0 ? (
                    <div className="space-y-4">
                        {chatsList.map((chat) => (
                            <motion.div
                                key={chat.id}
                                className="card flex bg-muted/20 rounded-xl px-4 py-3 mb-2 shadow-sm"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                            >
                                <div className="flex flex-col justify-between">
                                    <div>ID: {chat.id}</div>
                                    <div className="text-sm text-gray-500">Created: {formatDate(chat.created_at)}</div>
                                </div>
                                <div className="flex flex-col justify-center items-center pl-10">
                                    <ArrowRight size={20} onClick={() => {
                                        fetchLastConversation(chat["id"]);
                                        handleClose();
                                    }}></ArrowRight>
                                    <Trash className='mt-2' size={20} onClick={async () => { await removeChat(chat["id"]) }}></Trash>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ) : listReceived ? <span>You dont have chats.</span> : <span>Loading...</span>}
            </AnimatePresence>
        </div>
    );
};