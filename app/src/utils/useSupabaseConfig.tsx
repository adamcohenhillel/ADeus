import { Preferences } from '@capacitor/preferences';
import { SupabaseClient, User, createClient } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';

export function useSupabaseConfig() {
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseToken, setSupabaseToken] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchConfig() {
      try {
        const supabaseUrlValue = await Preferences.get({ key: 'supabaseUrl' });
        const supabaseTokenValue = await Preferences.get({
          key: 'supabaseToken',
        });

        if (supabaseUrlValue.value) {
          setSupabaseUrl(JSON.parse(supabaseUrlValue.value));
        }
        if (supabaseTokenValue.value) {
          setSupabaseToken(JSON.parse(supabaseTokenValue.value));
        }
      } catch (error) {
        // Handle any error that might occur during fetching
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    fetchConfig();
  }, []);

  const setSupabaseConfig = async (
    newSupabaseUrl: string,
    newSupabaseToken: string
  ) => {
    try {
      await Preferences.set({
        key: 'supabaseUrl',
        value: JSON.stringify(newSupabaseUrl),
      });
      await Preferences.set({
        key: 'supabaseToken',
        value: JSON.stringify(newSupabaseToken),
      });
      setSupabaseUrl(newSupabaseUrl);
      setSupabaseToken(newSupabaseToken);
    } catch (error) {
      // Handle any error that might occur during setting
      console.error(error);
    }
  };

  return { supabaseUrl, supabaseToken, setSupabaseConfig, loading };
}

export function useSupabaseClient() {
  const { supabaseUrl, supabaseToken, loading } = useSupabaseConfig();
  const [supabaseClient, setSupabaseClient] = useState<SupabaseClient>();

  useEffect(() => {
    if (supabaseUrl && supabaseToken) {
      const client = createClient(supabaseUrl, supabaseToken);
      setSupabaseClient(client);
    }
  }, [supabaseUrl, supabaseToken]);

  return { supabaseClient, loading };
}

export function useSupabase() {
  const { supabaseClient, loading } = useSupabaseClient();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (!supabaseClient) return;

    const { data: authListener } = supabaseClient.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [supabaseClient]);

  return { user, supabaseClient, loading };
}
