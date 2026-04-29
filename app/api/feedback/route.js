import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req) {
  try {
    const { goal, weekTitle, assignment, submission, replyCount, conversation } = await req.json();

    const isLastReply = replyCount === 2;

    const response = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        {
          role: 'system',
          content: `You are a warm but honest programming teacher having a conversation with a student. This is reply ${replyCount + 1} of 3. ${isLastReply ? 'This is your LAST reply. Give a final summary, wrap up encouragingly, and tell them to mark this week complete.' : 'Be concise and conversational — this is a back-and-forth chat, not an essay.'} Respond in plain text, no markdown.`,
        },
        {
          role: 'user',
          content: `Student goal: "${goal}"
Week topic: ${weekTitle}
Assignment: ${assignment.title} — ${assignment.description}
Expected: ${assignment.deliverable}

Conversation so far:
${conversation.map(m => `${m.role === 'student' ? 'Student' : 'Teacher'}: ${m.text}`).join('\n\n')}

Latest message: "${submission}"

${isLastReply ? 'Give your final feedback and wrap up. Tell them they are ready to move to the next week.' : 'Respond naturally as a teacher would in a conversation.'}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    return Response.json({ feedback: response.choices[0].message.content });
  } catch (err) {
    console.error('ERROR:', err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
}