import { createClient } from '@supabase/supabase-js';
import { createFirebaseVerifier } from '../_shared/firebase.ts';
import { createAuthSyncHandler } from './handler.ts';

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { persistSession: false, autoRefreshToken: false },
});

Deno.serve(
  createAuthSyncHandler({
    verifyToken: createFirebaseVerifier(Deno.env.get('FIREBASE_PROJECT_ID')!),
    rpc: async (name, args) => {
      const { data, error } = await supabase.rpc(name, args);
      return { data, error: error ? { message: error.message } : null };
    },
  }),
);
