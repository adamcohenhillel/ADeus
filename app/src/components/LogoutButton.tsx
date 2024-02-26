import { SupabaseClient } from '@supabase/supabase-js';
import { LogOut } from 'lucide-react';
import { useRouter } from 'next/router';

import { Button } from './ui/button';

export default function LogoutButton({
  supabaseClient,
}: {
  supabaseClient: SupabaseClient;
}) {
  const router = useRouter();

  return (
    <Button
      size={'icon'}
      className="bg-muted/20 text-muted-foreground hover:bg-muted/40 rounded-full"
      onClick={async () => {
        await supabaseClient.auth.signOut();
        router.reload();
      }}
    >
      <LogOut size={20} />
    </Button>
  );
}
