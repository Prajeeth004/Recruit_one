import { GoogleGenAI } from '@google/genai'

export async function POST(request: Request) {
    try {
        const { candidateDetails } = await request.json()

        const ai = new GoogleGenAI({
            apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY,
        })

        const model = 'gemini-2.5-flash-lite'

        const prompt = `Generate 10 interview questions (5 technical, 5 behavioral) for a candidate with the following profile:

Name: ${candidateDetails.name}
Skills: ${candidateDetails.skills}
Work History: ${candidateDetails.workHistory}
Education: ${candidateDetails.educationHistory}
Experience Level: ${candidateDetails.experienceLevel || 'Not specified'}

The questions should be challenging and relevant to their specific skills and experience.
RETURN THE RESPONSE AS A PURE JSON ARRAY of objects with "category" and "question" keys.
Example: [{"category": "Technical", "question": "..."}]
Do not include any markdown formatting or code blocks.`

        const contents = [
            {
                role: 'user',
                parts: [
                    {
                        text: prompt,
                    },
                ],
            },
        ]

        const response = await ai.models.generateContentStream({
            model,
            contents,
        })

        let text = ''
        for await (const chunk of response) {
            if (chunk.text) {
                text += chunk.text
            }
        }

        // Clean up markdown code blocks if present
        const jsonStr = text.replace(/```json\n?|\n?```/g, '').trim()
        const questions = JSON.parse(jsonStr)

        return Response.json({ questions })
    } catch (error) {
        console.error('Error generating questions:', error)
        return Response.json(
            { error: 'Failed to generate interview questions' },
            { status: 500 }
        )
    }
}
