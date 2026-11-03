import { supabase } from '@/services/supabase-perfil/client';

export async function signInWithEmail(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

export async function signUpWithEmail(email: string, password: string, displayName: string) {
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { display_name: displayName } }, // read by handle_new_user()
  });
  if (error) throw error;
}

export const signOut = () => supabase.auth.signOut();