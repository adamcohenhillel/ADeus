import React, { useState, useEffect } from "react";

import { useSupabase } from "@/utils/useSupabaseConfig";
import LoginForm from "@/components/LoginForm";
import Chat from "@/components/Chat";

export default function Index() {
  const { user, supabaseClient } = useSupabase();
  
  if (!user || !supabaseClient) {
    return <LoginComponent />;
  }

  return <ChatComponent supabaseClient={supabaseClient} />;
}

