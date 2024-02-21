import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { SupabaseClient } from '@supabase/supabase-js';
import { Sidebar } from 'lucide-react';
import ConversationHistory from './ConversationHistory';

export default function SideMenu({
  supabaseClient,
  setConversationId,
}: {
  supabaseClient: SupabaseClient;
  setConversationId: (id: number) => void;
}) {
  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="hover:bg-muted hover:text-muted-foreground"
        >
          <Sidebar />
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <div className="mx-auto w-full max-w-sm">
          <DrawerHeader>
            <DrawerTitle>History</DrawerTitle>
          </DrawerHeader>
          <DrawerFooter>
            <ConversationHistory
              supabaseClient={supabaseClient}
              setConversationId={setConversationId}
            />
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
