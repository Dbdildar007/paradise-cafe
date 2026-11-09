import { createClient } from '@supabase/supabase-js';
import { createOtpGuardHandler } from './handler.ts';

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { persistSession: false, autoRefreshToken: false },
});

Deno.serve(
  createOtpGuardHandler({
    rpc: async (name, args) => {
      const { data, error } = await supabase.rpc(name, args);
      return { data, error: error ? { message: error.message } : null };
    },
    pepper: Deno.env.get('OTP_HASH_PEPPER')!,
  }),
);
