import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { SupabaseClient } from '@supabase/supabase-js';
import { LogOut, MessageCirclePlus, Sidebar } from 'lucide-react';
import ConversationHistory from './ConversationHistory';
import SettingsDialog from './SettingsDialog';

export default function SideMenu({
  supabaseClient,
  setConversationId,
  newConversation,
}: {
  supabaseClient: SupabaseClient;
  setConversationId: (id: number) => void;
  newConversation: { mutate: () => void };
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
      <DrawerContent className="w-[90vw] border-l-0">
        <div className="mx-2 flex w-full flex-col">
          <DrawerHeader className="px-0">
            <DrawerClose>
              <Button
                onClick={() => {
                  newConversation.mutate();
                }}
                className="flex w-full justify-start"
                variant={'outline'}
              >
                ADeus <MessageCirclePlus size={20} className="ml-auto" />
              </Button>
            </DrawerClose>
          </DrawerHeader>
          <div className="relative h-full overflow-auto">
            <ConversationHistory
              supabaseClient={supabaseClient}
              setConversationId={setConversationId}
            />
            <div className="from-background pointer-events-none sticky -bottom-2 h-16 bg-gradient-to-t" />
          </div>
          <DrawerFooter className="flex px-0">
            <DrawerClose>
              <Button
                className="w-full"
                variant={'outline'}
                onClick={() => {
                  newConversation.mutate();
                }}
              >
                New Conversation{' '}
                <MessageCirclePlus size={20} className="ml-auto" />
              </Button>
            </DrawerClose>
            <Button
              className="w-full"
              variant={'outline'}
              onClick={async () => await supabaseClient.auth.signOut()}
            >
              Logout
              <LogOut className="ml-auto" size={20} />
            </Button>
            <SettingsDialog />
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
