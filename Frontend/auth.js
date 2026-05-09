const SUPABASE_URL = 'https://mzysoyzojevfiiofjump.supabase.co';
const SUPABASE_ANON_KEY = 'PASTE_YOUR_SUPABASE_ANON_KEY_HERE';

const AUTH_STORAGE_KEY = 'fintrack_supabase_session';
const USER_STORAGE_KEY = 'fintrack_username';

const headers = {
  apikey: SUPABASE_ANON_KEY,
  'Content-Type': 'application/json'
};

function isConfigValid() {
  return Boolean(SUPABASE_URL) && SUPABASE_ANON_KEY !== 'PASTE_YOUR_SUPABASE_ANON_KEY_HERE';
}

function getSession() {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY);
  return raw ? JSON.parse(raw) : null;
}

function saveSession(session) {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
}

function clearSession() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

async function signUp({ email, password, username }) {
  const authResponse = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ email, password })
  });

  const authData = await authResponse.json();
  if (!authResponse.ok) {
    throw new Error(authData.msg || authData.error_description || 'Signup failed.');
  }

  if (!authData.access_token) {
    return {
      needsEmailConfirmation: true,
      message: 'Signup succeeded. Check your email to confirm before logging in.'
    };
  }

  saveSession(authData);

  const profileResponse = await fetch(`${SUPABASE_URL}/rest/v1/profiles`, {
    method: 'POST',
    headers: {
      ...headers,
      Authorization: `Bearer ${authData.access_token}`,
      Prefer: 'resolution=merge-duplicates,return=representation'
    },
    body: JSON.stringify({ id: authData.user.id, username, email })
  });

  if (!profileResponse.ok) {
    const profileError = await profileResponse.json();
    throw new Error(profileError.message || 'Account created, but profile insert failed.');
  }

  localStorage.setItem(USER_STORAGE_KEY, username);
  return { needsEmailConfirmation: false };
}

async function signIn({ email, password }) {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ email, password })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error_description || data.msg || 'Invalid email or password.');
  }

  saveSession(data);

  const profileResponse = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${data.user.id}&select=username`, {
    headers: {
      ...headers,
      Authorization: `Bearer ${data.access_token}`
    }
  });

  if (profileResponse.ok) {
    const rows = await profileResponse.json();
    if (rows[0]?.username) {
      localStorage.setItem(USER_STORAGE_KEY, rows[0].username);
    }
  }

  return data;
}

function requireAuthOrRedirect() {
  const session = getSession();
  if (!session?.access_token) {
    window.location.href = 'login.html';
    return null;
  }
  return session;
}
