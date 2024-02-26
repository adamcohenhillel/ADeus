import type { GetServerSidePropsContext } from 'next';

import { createClient as createServerClient } from '@/utils/supabase/server-props';
import LoginForm from '@/components/LoginForm';

export default function Login() {
  return <LoginForm />;
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const supabase = createServerClient(context);
  const { data, error } = await supabase.auth.getUser();

  if (data.user && !error) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  }

  return { props: {} };
}
