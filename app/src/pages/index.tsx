import React, { useState, useEffect } from "react";

import { useSupabase } from "@/utils/useSupabaseConfig";
import LoginForm from "@/components/LoginForm";
import Chat from "@/components/Chat";

export default function Index() {
  const [loggedIn, setLoggedIn] = useState(false);

  const { user, supabaseClient } = useSupabase();

  useEffect(() => {
    if (user) {
      setLoggedIn(true);
    } else {
      setLoggedIn(false);
    }
  }, [user]);

  return (
    <>
      {loggedIn && user ? (
        <Chat supabaseClient={supabaseClient} />
      ) : (
        <LoginForm />
      )}
    </>
  );
}
