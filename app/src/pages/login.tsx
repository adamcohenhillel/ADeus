import Link from "next/link";

import { useState, useEffect } from "react";
import { useRouter } from "next/router";

import { toast } from "react-toastify";
import {
  useSupabaseClient,
  useSupabaseConfig,
} from "@/utils/useSupabaseConfig";
import { createClient } from "@supabase/supabase-js";

export default function Login() {
  const router = useRouter();

  const [supabaseUrl, setSupabaseUrl] = useState("");
  const [supabaseToken, setSupabaseToken] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");

  const { setSupabaseConfig } = useSupabaseConfig();
  const supabaseClient2 = useSupabaseClient();

  async function EmailLogin() {
    let supabaseClient;
    try {
      supabaseClient = createClient(supabaseUrl, supabaseToken);
      if (!supabaseClient) {
        throw new Error("No Supabase client");
      }
    } catch (error: any) {
      console.error("ERROR", error);
      toast.error(
        `Error connecting to your Supabase: ${
          error.message || error.code || error.msg || "Unknown error"
        }`
      );
      return;
    }
    setSupabaseConfig(supabaseUrl, supabaseToken);

    try {
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password,
      });
      console.log("2", data, error);
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Login successful");
        router.push("/");
      }
    } catch (error: any) {
      console.error("ERROR", error);
      toast.error(error.message || error.code || error.msg || "Unknown error");
    }
  }

  useEffect(() => {
    try {
      supabaseClient2.auth.getUser().then((user) => {
        console.log("user", user);
        router.push("/");
      });
    } catch (error) {
      console.log("errory", error);
    }
  }, [router, supabaseClient2]);

  return (
    <div className="pt-safe mt-6 flex flex-col w-full p-8 bg-deepenCream">
      <h1 className="pt-4 text-2xl font-bold">Login to ADeus</h1>

      <div>
        <div className="flex flex-wrap pt-4">
          <label
            className="block text-black text-sm font-medium mb-1"
            htmlFor="text"
          >
            Supabase URL
          </label>
          <input
            id="supabaseUrl"
            placeholder={"Enter your Supabase URL"}
            type="text"
            value={supabaseUrl}
            onChange={(e) => setSupabaseUrl(e.target.value)}
            className="form-input w-full text-gray-800 h-10 border-2 rounded-md pl-2"
            required
          />
        </div>

        <div className="flex flex-wrap pt-4">
          <label
            className="block text-black text-sm font-medium mb-1"
            htmlFor="email"
          >
            Supabase Token
          </label>
          <input
            id="supabaseToken"
            placeholder={"Enter your Supabase token"}
            type="text"
            value={supabaseToken}
            onChange={(e) => setSupabaseToken(e.target.value)}
            className="form-input w-full text-gray-800 h-10 border-2 rounded-md pl-2"
            required
          />
        </div>

        <div className="flex flex-wrap pt-4">
          <label
            className="block text-black text-sm font-medium mb-1"
            htmlFor="email"
          >
            Email
          </label>
          <input
            id="email"
            placeholder={"Enter your Email"}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="form-input w-full text-gray-800 h-10 border-2 rounded-md pl-2"
            required
          />
        </div>
        <div className="flex flex-wrap pt-4">
          <label
            className="block text-black text-sm font-medium mb-1"
            htmlFor="password"
          >
            Password
          </label>
          <input
            id="password1"
            placeholder="********"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="form-input w-full text-gray-800 h-10 border-2 rounded-md pl-2"
            required
          />
        </div>

        <div className="flex flex-col items-center mt-6">
          <button
            onClick={EmailLogin}
            className="w-full flex justify-center items-center h-10 font-bold rounded-md text-white bg-black active:bg-deepenRegular shadow-sm"
          >
            nexum
          </button>
        </div>
      </div>
      <p className="mt-8 text-sm text-gray-400 pb-6 mb-safe">
        Don't have these details? Please check the setup guide{" "}
        <Link className="underline" href="https://x.com/adamcohenhillel">
          here
        </Link>
      </p>
    </div>
  );
}
