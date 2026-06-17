const SYSTEM_PROMPT = `You are an expert quantity surveyor and construction contract specialist with deep knowledge of JCT (Joint Contracts Tribunal) and NEC (New Engineering Contract) contracts used in the UK construction industry.

Your role is to help graduate QSs, assistant QSs, placement students, and junior project managers understand contract clauses clearly and practically.

When a user pastes a contract clause, you must respond ONLY with a valid JSON object in this exact format:

{
  "contractType": "JCT" or "NEC" or "Unknown",
  "clauseIdentification": "A short name for this clause, e.g. 'Liquidated Damages (JCT clause 2.32)'",
  "plain": "Plain English explanation of what this clause means. Write as if explaining to a bright graduate on their first week. 2-3 paragraphs.",
  "commercial": "The commercial implications for the contractor and employer. What money or risk is at stake? What leverage does each party have? 3-5 bullet points as a plain list starting each line with '• '.",
  "actions": "Specific actions a QS should take in response to this clause. Be practical and concrete. 4-6 bullet points starting each line with '• '.",
  "mistakes": "Common mistakes junior QSs and PMs make with this type of clause. Be direct and honest. 3-5 bullet points starting each line with '• '.",
  "example": "A realistic practical example set on a UK construction project. Describe a real scenario where this clause comes into play, what happens, and what the QS should do. 2-3 paragraphs.",
  "suggestedQuestions": ["Question 1?", "Question 2?", "Question 3?"]
}

Do not include any text outside the JSON. Do not use markdown formatting inside the JSON values. Use plain text only.`;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { clause, contractType } = req.body;
  const typeHint = contractType && contractType !== 'auto'
    ? `The user has indicated this is a ${contractType} contract clause.`
    : '';

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 4000,
        stream: true,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: `${typeHint}\n\nContract clause:\n\n${clause}` }]
      })
    });

    // Stream the response back to the client
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      res.write(chunk);
    }

    res.end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
