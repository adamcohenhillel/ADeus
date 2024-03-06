import Chat from '@/components/Chat';
import LoginForm from '@/components/LoginForm';
import { useSupabase } from '@/utils/useSupabaseConfig';

export default function Index() {
  const { user, supabaseClient, loading } = useSupabase();

  if (loading) {
    return null;
  }

  if (!user || !supabaseClient) {
    return <LoginForm />;
  }

  return <Chat supabaseClient={supabaseClient} />;
}
