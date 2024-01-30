import { useEffect, useState } from "react";
import { Preferences } from "@capacitor/preferences";
import { createClient } from "@supabase/supabase-js";

export function useSupabaseConfig() {
  const [supabaseUrl, setSupabaseUrl] = useState("");
  const [supabaseToken, setSupabaseToken] = useState("");

  useEffect(() => {
    async function fetchConfig() {
      try {
        const supabaseUrlValue = await Preferences.get({ key: "supabaseUrl" });
        const supabaseTokenValue = await Preferences.get({
          key: "supabaseToken",
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
        key: "supabaseUrl",
        value: JSON.stringify(newSupabaseUrl),
      });
      await Preferences.set({
        key: "supabaseToken",
        value: JSON.stringify(newSupabaseToken),
      });
      setSupabaseUrl(newSupabaseUrl);
      setSupabaseToken(newSupabaseToken);
    } catch (error) {
      // Handle any error that might occur during setting
      console.error(error);
    }
  };

  return { supabaseUrl, supabaseToken, setSupabaseConfig };
}

export function useSupabaseClient() {
  const { supabaseUrl, supabaseToken } = useSupabaseConfig();
  const [supabaseClient, setSupabaseClient] = useState<any>();

  useEffect(() => {
    if (supabaseUrl && supabaseToken) {
      const client = createClient(supabaseUrl, supabaseToken);
      setSupabaseClient(client);
    }
  }, [supabaseUrl, supabaseToken]);

  return supabaseClient;
}
