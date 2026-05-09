export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { questions } = req.body
  if (!questions) return res.status(400).json({ error: 'questions required' })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' })

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 800,
      messages: [{
        role: 'user',
        content: `Validate and tag these nursing exam questions.
1. If NOT legitimate nursing/medical content, return: {"valid":false,"reason":"explanation"}
2. If valid return: {"valid":true,"topics":["tag1","tag2"],"difficulties":{"questionId":"easy|medium|hard"}}
Questions: ${JSON.stringify(questions)}
Return ONLY JSON.`,
      }],
    }),
  })

  const data = await response.json()
  res.status(response.status).json(data)
}
