

import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

/* ---------------- SUPABASE ---------------- */
const SUPABASE_URL = 'https://mzysoyzojevfiiofjump.supabase.co'; 
const SUPABASE_ANON_KEY = 'sb_publishable_sxyEvrmij9RoeeorMzZQEg_rc_7t21B';

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

/* ---------------- LOGIN ---------------- */
export async function signIn(email, password) {
  const { data, error } =
    await supabase.auth.signInWithPassword({
      email,
      password
    });

  if (error) throw error;

  return data;
}

/* ---------------- SIGNUP ---------------- */
export async function signUp(
  email,
  password,
  username
) {
  const { data, error } =
    await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: username
        }
      }
    });

  if (error) throw error;

  return data;
}

/* ---------------- LOGOUT ---------------- */
export async function logout() {
  await supabase.auth.signOut();
  window.location.href = "login.html";
}

/* ---------------- GET USER ---------------- */
export async function getUser() {
  const {
    data: { user }
  } = await supabase.auth.getUser();

  return user;
}

/* ---------------- GET SESSION ---------------- */
export async function getSession() {
  const {
    data: { session }
  } = await supabase.auth.getSession();

  return session;
}

/* ---------------- PROTECT PAGE ---------------- */
export async function requireAuth() {
  const session = await getSession();

  if (!session) {
    window.location.href = "login.html";
    return null;
  }

  return session;
}