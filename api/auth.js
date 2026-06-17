import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { action, email, password, token } = req.body;

  try {
    if (action === 'signup') {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) return res.status(400).json({ error: error.message });
      return res.status(200).json({ user: data.user, session: data.session });
    }

    if (action === 'signin') {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return res.status(400).json({ error: error.message });
      return res.status(200).json({ user: data.user, session: data.session });
    }

    if (action === 'signout') {
      await supabase.auth.signOut();
      return res.status(200).json({ success: true });
    }

    return res.status(400).json({ error: 'Unknown action' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
