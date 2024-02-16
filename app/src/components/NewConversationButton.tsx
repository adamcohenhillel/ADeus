import { Plus } from 'lucide-react';
import { Button } from './ui/button';

export default function NewConversationButton({
  createNewConversation,
}: {
  createNewConversation: () => void;
}) {
  return (
    <Button
      size={'icon'}
      className="bg-muted/20 text-muted-foreground hover:bg-muted/40 rounded-full"
      onClick={createNewConversation}
    >
      <Plus size={20} />
    </Button>
  );
}
