import { SupabaseClient } from '@supabase/supabase-js';
import { LogOut } from 'lucide-react';
import { Button } from './ui/button';

export default function LogoutButton({
  supabaseClient,
}: {
  supabaseClient: SupabaseClient;
}) {
  return (
    <Button
      size={'icon'}
      className="bg-muted/20 text-muted-foreground hover:bg-muted/40 rounded-full"
      onClick={async () => await supabaseClient.auth.signOut()}
    >
      <LogOut size={20} />
    </Button>
  );
}
