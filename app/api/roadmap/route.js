import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req) {
  try {
    const { goal, level, stack } = await req.json();

    const response = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        {
          role: 'system',
          content: 'You are a JSON API. Only respond with valid raw JSON. No markdown, no backticks, no explanation.',
        },
        {
          role: 'user',
          content: `Create a programming roadmap for someone who wants to build: "${goal}". Their level: ${level}. ${stack ? `They want to use: ${stack}. Build the entire roadmap around these technologies. If the stack is wrong for their goal, still use it but mention better alternatives in the focus field.` : 'Choose the best tech stack for their goal.'}

Return this exact JSON:
{
  "title": "catchy roadmap title",
  "summary": "2 sentence overview",
  "techStack": ["tech1", "tech2", "tech3"],
  "weeks": [
    {
      "week": 1,
      "title": "week title",
      "focus": "one sentence focus",
      "topics": ["topic1", "topic2", "topic3"],
      "assignment": {
        "title": "assignment title",
        "description": "what to build",
        "deliverable": "what they have at end",
        "hints": ["hint1", "hint2"]
      },
      "milestone": "what they can do after this week",
      "resources": [
        { "type": "video", "title": "YouTube tutorial title", "url": "https://www.youtube.com/results?search_query=topic+tutorial" },
        { "type": "article", "title": "article title", "url": "https://www.freecodecamp.org or w3schools or mdn real url" },
        { "type": "docs", "title": "official docs title", "url": "real official docs url" }
      ]
    }
  ],
  "finalProject": "final project description",
  "hookTip": "one motivating insight"
}

Make 8 weeks total. Return ONLY the JSON.`,
        },
      ],
      temperature: 0.3,
      max_tokens: 4000,
    });

    const text = response.choices[0].message.content;
    const match = text.match(/\{[\s\S]*\}/);
    const data = JSON.parse(match[0]);
    return Response.json(data);
  } catch (err) {
    console.error('ERROR:', err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
}