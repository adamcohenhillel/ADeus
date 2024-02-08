import React from 'react'
import { Button } from './ui/button';
import { Plus } from 'lucide-react';

export default function NewConversationButton({
  createNewConversation,
}: {
  createNewConversation: () => void;
}) {
  return (
    <Button
      size={"icon"}
      className="rounded-full bg-muted/20 text-muted-foreground hover:bg-muted/40"
      onClick={createNewConversation}
    >
      <Plus size={20} />
    </Button>
  )
}
