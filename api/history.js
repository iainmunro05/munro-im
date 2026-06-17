export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;
  const authHeader = req.headers.authorization;

  if (!authHeader) return res.status(401).json({ error: 'Not authenticated' });

  const headers = {
    'Content-Type': 'application/json',
    'apikey': supabaseKey,
    'Authorization': authHeader
  };

  try {
    if (req.method === 'POST') {
      const { title, contract_type, clause_text, explanation, user_id } = req.body;
      const response = await fetch(`${supabaseUrl}/rest/v1/saved_clauses`, {
        method: 'POST',
        headers: { ...headers, 'Prefer': 'return=representation' },
        body: JSON.stringify({ title, contract_type, clause_text, explanation, user_id })
      });
      const data = await response.json();
      return res.status(response.ok ? 200 : 400).json(data);
    }

    if (req.method === 'GET') {
      const response = await fetch(
        `${supabaseUrl}/rest/v1/saved_clauses?order=created_at.desc&limit=5`,
        { headers }
      );
      const data = await response.json();
      return res.status(200).json(data);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
