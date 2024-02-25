import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from './ui/button';
import { createClient } from '@/utils/supabase/component';

export default function LoginForm() {
  const router = useRouter();
  const supabase = createClient();
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success('Login successful');
      router.reload();
    } catch (error: any) {
      toast.error(error.message || error.code || error.msg || 'Unknown error');
    }
  }

  return (
    <div className="pt-safe mt-6 flex w-full flex-col p-8">
      <h1 className="pt-4 text-2xl font-bold">Login to ADeus</h1>
      <form onSubmit={handleLogin}>
        <div className="flex flex-wrap pt-4">
          <label className="mb-1  block text-sm font-medium" htmlFor="email">
            Email
          </label>
          <input
            autoFocus
            id="email"
            placeholder="Enter your Email"
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
          <Button type="submit" className="w-full font-bold">
            Login
          </Button>
        </div>
      </form>
      <p className="mt-8 pb-6 text-sm opacity-50">
        Don&apos;t have these details? Please check the setup guide{' '}
        <Link
          className="underline"
          href="https://docs.adeus.ai"
          target="_blank"
          rel="noopener noreferrer"
        >
          here
        </Link>
      </p>
    </div>
  );
}
