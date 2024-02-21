import { useSupabaseConfig } from '@/utils/useSupabaseConfig';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from './ui/button';

export default function LoginForm() {
  const router = useRouter();

  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseToken, setSupabaseToken] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');

  const {
    supabaseUrl: savedUrl,
    supabaseToken: savedToken,
    setSupabaseConfig,
  } = useSupabaseConfig();

  useEffect(() => {
    if (savedUrl) {
      setSupabaseUrl(savedUrl);
    }
    if (savedToken) {
      setSupabaseToken(savedToken);
    }
  }, [savedUrl, savedToken]);

  async function emailLogin() {
    try {
      const supabaseClient = createClient(supabaseUrl, supabaseToken);
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        toast.error(error.message);
      } else {
        toast.success('Login successful');
        setSupabaseConfig(supabaseUrl, supabaseToken);
        router.reload();
      }
    } catch (error: any) {
      console.error('ERROR', error);
      toast.error(error.message || error.code || error.msg || 'Unknown error');
    }
  }

  return (
    <div className="pt-safe mt-6 flex w-full flex-col p-8">
      <h1 className="pt-4 text-2xl font-bold">Login to ADeus</h1>

      <div>
        <div className="flex flex-wrap pt-4">
          <label className="mb-1  block text-sm font-medium" htmlFor="text">
            Supabase URL
          </label>
          <input
            id="supabaseUrl"
            placeholder={'Enter your Supabase URL'}
            type="text"
            value={supabaseUrl}
            onChange={(e) => setSupabaseUrl(e.target.value)}
            className="form-input h-10  w-full rounded-md border-2 pl-2"
            required
          />
        </div>

        <div className="flex flex-wrap pt-4">
          <label className="mb-1  block text-sm font-medium" htmlFor="email">
            Supabase Token
          </label>
          <input
            id="supabaseToken"
            placeholder={'Enter your Supabase token'}
            type="text"
            value={supabaseToken}
            onChange={(e) => setSupabaseToken(e.target.value)}
            className="form-input h-10  w-full rounded-md border-2 pl-2"
            required
          />
        </div>

        <div className="flex flex-wrap pt-4">
          <label className="mb-1  block text-sm font-medium" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            placeholder={'Enter your Email'}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="form-input h-10  w-full rounded-md border-2 pl-2"
            required
          />
        </div>
        <div className="flex flex-wrap pt-4">
          <label className="mb-1 block text-sm font-medium" htmlFor="password">
            Password
          </label>
          <input
            id="password1"
            placeholder="********"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="form-input h-10  w-full rounded-md border-2 pl-2"
            required
          />
        </div>

        <div className="mt-6 flex flex-col items-center">
          <Button onClick={emailLogin} className="w-full font-bold">
            Login
          </Button>
        </div>
      </div>
      <p className="mt-8 pb-6 text-sm opacity-50">
        Don&apos;t have these details? Please check the setup guide{' '}
        <Link className="underline" href="https://x.com/adamcohenhillel">
          here
        </Link>
      </p>
    </div>
  );
}
