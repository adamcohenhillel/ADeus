import { useSupabase } from "@/utils/useSupabaseConfig";
import LoginForm from "@/components/LoginForm";
import Chat from "@/components/Chat";

export default function Index() {
  const { user, supabaseClient } = useSupabase();
  
  if (!user || !supabaseClient) {
    return <LoginForm />;
  }

  return <Chat supabaseClient={supabaseClient} />;
}

