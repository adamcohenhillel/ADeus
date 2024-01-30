import React, { ReactNode, useEffect } from "react";
import { useRouter } from "next/router";

import { useSupabaseClient } from "@/utils/useSupabaseConfig";

export default function LoginRequired({ children }: { children: ReactNode }) {
  const router = useRouter();

  const supabaseClient = useSupabaseClient();

  useEffect(() => {
    if (supabaseClient) {
      try {
        supabaseClient.auth
          .getUser()
          .then((user) => {
            console.log("user", user);
          })
          .catch((error) => {
            router.push("/login");
          });
      } catch (error) {
        router.push("/login");
      }
    }
  }, [router, supabaseClient]);

  return <>{children}</>;
}
