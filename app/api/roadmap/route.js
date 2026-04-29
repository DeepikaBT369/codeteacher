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
          content: `Create a programming roadmap for someone who wants to build: "${goal}". Their level: ${level}. ${stack ? `They want to use: ${stack}.` : 'Choose the best tech stack.'}

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
        {
          "type": "video",
          "title": "YouTube: topic tutorial for beginners",
          "url": "https://www.youtube.com/results?search_query=topic+tutorial+for+beginners"
        },
        {
          "type": "article",
          "title": "W3Schools or MDN: topic",
          "url": "https://www.w3schools.com/js/"
        },
        {
          "type": "docs",
          "title": "Official documentation",
          "url": "https://reactjs.org"
        }
      ]
    }
  ],
  "finalProject": "final project description",
  "hookTip": "one motivating insight"
}

STRICT RULES:
1. YouTube URL MUST be: https://www.youtube.com/results?search_query=TOPIC+tutorial+for+beginners — replace TOPIC with real week topic, use + between words
2. Article MUST be real URL from w3schools.com or developer.mozilla.org
3. Docs MUST be real official docs URL for the exact technology
4. Make exactly 8 weeks
Return ONLY the JSON.`,
        },
      ],
      temperature: 0.3,
      max_tokens: 4000,
    });

    const text = response.choices[0].message.content;
    const match = text.match(/\{[\s\S]*\}/);
    const data = JSON.parse(match[0]);

    // Force fix YouTube URLs
    data.weeks = data.weeks.map(week => ({
      ...week,
      resources: week.resources?.map(r => {
        if (r.type === 'video') {
          const query = week.title.replace(/\s+/g, '+').toLowerCase();
          return {
            ...r,
            url: `https://www.youtube.com/results?search_query=${query}+tutorial+for+beginners`
          };
        }
        return r;
      })
    }));

    return Response.json(data);
  } catch (err) {
    console.error('ERROR:', err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
}