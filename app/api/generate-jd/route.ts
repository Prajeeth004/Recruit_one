import { GoogleGenAI } from '@google/genai'

export async function POST(request: Request) {
  try {
    const { jobDetails } = await request.json()

    const ai = new GoogleGenAI({
      apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY,
    })

    const model = 'gemini-2.5-flash-lite'

    const prompt = `Generate a professional job description based on the following details:

Job Title: ${jobDetails.title}
Company: ${jobDetails.company}
Status: ${jobDetails.status}
Location: ${jobDetails.city}, ${jobDetails.state}, ${jobDetails.country} (${jobDetails.jobLocationType})
Experience: ${jobDetails.minExperience} - ${jobDetails.maxExperience} years
Salary Range: ${jobDetails.minSalary} - ${jobDetails.maxSalary}
Skills / Keywords: ${jobDetails.keywords}

Additional Details:
- Note for Candidates: ${jobDetails.noteForCandidates}
- Openings: ${jobDetails.openings}
- Job Category: ${jobDetails.jobCategory}
- Target Companies: ${jobDetails.targetCompanies}
- Hiring Pipeline: ${jobDetails.hiringPipeline}
- Contact: ${jobDetails.contactName} (${jobDetails.contactEmail})

Please create a comprehensive and professional job description that includes:
1. About the Role (based on title and notes)
2. Key Responsibilities (infer from title and skills)
3. Required Qualifications (skills, experience)
4. What We Offer (salary, company context)

Keep the tone professional and engaging.`

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

    return Response.json({ description: text })
  } catch (error) {
    console.error('Error generating JD:', error)
    return Response.json(
      { error: 'Failed to generate job description' },
      { status: 500 }
    )
  }
}
