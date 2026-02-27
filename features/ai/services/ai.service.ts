import { GoogleGenAI } from "@google/genai";
import mammoth from 'mammoth';

const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY || '' });

// Helper: Convert File to Base64
const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = reader.result as string;
            // Remove data URL prefix (e.g., "data:application/pdf;base64,")
            const base64 = result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = error => reject(error);
    });
};

// Helper: Extract text from DOCX file
const extractTextFromDocx = async (file: File): Promise<string> => {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        return result.value;
    } catch (error) {
        throw new Error(`Failed to extract text from DOCX: ${error}`);
    }
};

// ==========================================
// AI Services (Client-Side)
// ==========================================

// Candidate Schema
const candidateSchema = {
    type: "object",
    properties: {
        // Personal Information
        firstName: { type: "string" },
        lastName: { type: "string" },
        email: {
            type: "string",
            description: "Valid email address in format user@domain.com"
        },
        phone: { type: "string" },
        locality: { type: "string" },
        city: { type: "string" },
        state: { type: "string" },
        country: { type: "string" },
        postalCode: { type: "string" },
        fullAddress: { type: "string" },
        willingToRelocate: { type: "boolean" },
        gender: { type: "string" },
        dateOfBirth: { type: "string" },
        summary: { type: "string" },

        // Work History
        workHistory: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    jobTitle: { type: "string" },
                    company: { type: "string" },
                    employmentType: { type: "string" },
                    industryType: { type: "string" },
                    location: { type: "string" },
                    startDate: { type: "string" },
                    endDate: { type: "string" },
                    salary: { type: "string" },
                    description: { type: "string" },
                },
                required: ["jobTitle", "company", "startDate", "endDate", "description"],
            },
        },

        // Education History
        education: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    institution: { type: "string" },
                    educationalQualification: { type: "string" },
                    educationalSpecialization: { type: "string" },
                    startDate: { type: "string" },
                    endDate: { type: "string" },
                    grade: { type: "string" },
                    location: { type: "string" },
                    description: { type: "string" },
                },
                required: ["institution", "educationalQualification", "educationalSpecialization", "startDate", "endDate", "location"],
            },
        },

        // Employment Information
        employmentInfo: {
            type: "object",
            properties: {
                currentOrganization: { type: "string" },
                currentTitle: { type: "string" },
                totalExperienceYears: { type: "number" },
                relevantExperienceYears: { type: "number" },
                salaryType: { type: "string" },
                currencyType: { type: "string" },
                currentSalary: { type: "number" },
                salaryExpectation: { type: "number" },
                currentEmploymentStatus: { type: "string" },
                noticePeriodDays: { type: "number" },
                availableFrom: { type: "string" },
            },
        },

        // Skills
        skills: {
            type: "array",
            items: { type: "string" },
        },

        // Language Skills
        languageSkills: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    language: { type: "string" },
                    proficiencyLevel: { type: "string" },
                },
                required: ["language", "proficiencyLevel"],
            },
        },

        // Social Profile Links
        socialProfiles: {
            type: "object",
            properties: {
                facebookUrl: { type: "string" },
                twitterUrl: { type: "string" },
                linkedinUrl: { type: "string" },
                githubUrl: { type: "string" },
                xingUrl: { type: "string" },
            },
        },

        // Source
        source: { type: "string" },
    },
    required: [
        "firstName",
        "lastName",
        "phone",
        "workHistory",
        "education",
        "skills",
    ],
};

// Job Schema
const jobSchema = {
    type: "object",
    properties: {
        title: { type: "string" },
        description: { type: "string" },

        // Location Details
        city: { type: "string" },
        locality: { type: "string" },
        address: { type: "string" },
        postal_code: { type: "string" },
        location_type: {
            type: "string",
            enum: ["remote", "onsite", "hybrid"]
        },

        //Experience & Salary
        min_experience: { type: "number" },
        max_experience: { type: "number" },
        min_salary: { type: "number" },
        max_salary: { type: "number" },
        currency: { type: "string" },

        // Other Details
        openings: { type: "number" },
        skills: {
            type: "array",
            items: { type: "string" }
        },

        // Company/Contact info if available in JD
        company_name: { type: "string" },
        contact_email: { type: "string" },
        contact_phone: { type: "string" }
    },
    required: ["title", "description", "skills"]
};

export const parseResumeWithAI = async (file: File) => {
    try {
        let contentParts;

        // Handle DOCX files by extracting text first
        if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            const extractedText = await extractTextFromDocx(file);
            contentParts = [
                { text: "Extract following information from resume:" },
                { text: extractedText }
            ];
        } else {
            // Handle other supported file types (PDF, images, etc.)
            const base64Data = await fileToBase64(file);
            contentParts = [
                { text: "Extract following information from resume:" },
                { inlineData: { mimeType: file.type, data: base64Data } }
            ];
        }

        const model = "gemini-2.5-flash-lite";

        const enhancedPrompt = `
Extract candidate information from resume and return valid JSON.

IMPORTANT: 
- Email must be a valid email address (user@domain.com)
- If email is invalid or missing, set it to null
- Phone numbers can include +country code
- Validate all fields before returning

${contentParts.map(part => part.text || `[File: ${part.inlineData?.mimeType}]`).join('\n')}
`;

        const result = await ai.models.generateContent({
            model: model,
            contents: [
                {
                    role: "user",
                    parts: contentParts
                },
                {
                    role: "user",
                    parts: [{ text: enhancedPrompt }]
                }
            ],
            config: {
                responseMimeType: "application/json",
                responseJsonSchema: candidateSchema
            }
        });

        console.log("Gemini parseResume result:", result);

        // Extract text from the response structure
        let text;
        if (result.candidates?.[0]?.content?.parts?.[0]?.text) {
            text = result.candidates[0].content.parts[0].text;
        } else if (result.text) {
            text = result.text;
        } else {
            text = JSON.stringify(result);
        }

        return JSON.parse(text);
    } catch (error) {
        console.error("Error parsing resume with AI:", error);
        throw error;
    }
};

export const generateEmbedding = async (text: string) => {
    try {
        const result = await ai.models.embedContent({
            model: "gemini-embedding-001",
            contents: text,
            config: {
                outputDimensionality: 1536,
            }
        });

        console.log("Gemini embedding result:", result);

        // Extract embedding vector from known response shapes.
        // (Avoid accessing non-existent properties like `result.values` on EmbedContentResponse.)
        const extractEmbeddingValues = (res: unknown): number[] | null => {
            if (!res || typeof res !== "object") return null;

            // Shape: { embeddings: [{ values: number[] }] }
            if ("embeddings" in res) {
                const embeddings = (res as { embeddings?: Array<{ values?: unknown }> }).embeddings;
                const values = embeddings?.[0]?.values;
                if (Array.isArray(values) && values.every((v) => typeof v === "number")) {
                    return values as number[];
                }
            }

            // Fallback shape: { embedding: { values: number[] } }
            if ("embedding" in res) {
                const embedding = (res as { embedding?: { values?: unknown } }).embedding;
                const values = embedding?.values;
                if (Array.isArray(values) && values.every((v) => typeof v === "number")) {
                    return values as number[];
                }
            }

            return null;
        };

        const values = extractEmbeddingValues(result);
        if (values) return values;

        console.error("Unexpected embedding response structure:", result);
        throw new Error("Failed to extract embedding values from response");
    } catch (error) {
        console.error("Error generating embedding:", error);
        throw error;
    }
};

export const generateJobDescription = async (jobDetails: any) => {
    try {
        const prompt = `Generate a professional job description for:
        Title: ${jobDetails.title}
        Company: ${jobDetails.company}
        Skills: ${jobDetails.keywords}
        Experience: ${jobDetails.minExperience}-${jobDetails.maxExperience} years
        
        Include: About Role, Responsibilities, Requirements, What We Offer.`;

        const result = await ai.models.generateContent({
            model: "gemini-2.5-flash-lite",
            contents: [{ role: "user", parts: [{ text: prompt }] }]
        });

        console.log("Gemini generateJobDescription result:", result);

        // Extract text from the response structure
        if (result.candidates?.[0]?.content?.parts?.[0]?.text) {
            return result.candidates[0].content.parts[0].text;
        } else if (result.text) {
            return result.text;
        } else {
            return JSON.stringify(result);
        }
    } catch (error) {
        console.error("Error generating JD:", error);
        throw error;
    }
};

// ==========================================
// Qdrant Services (SDK)
// ==========================================

export const uploadToQdrant = async (collectionName: string, id: string, vector: number[], payload: any) => {
    try {
        const response = await fetch('/api/qdrant', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                collectionName,
                id,
                vector,
                payload
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to upload to Qdrant');
        }

        return await response.json();
    } catch (error) {
        console.error(`Error uploading to Qdrant (${collectionName}):`, error);
        // Don't block main flow if vector DB fails, but log it
    }
};

export const deleteFromQdrant = async (collectionName: string, entityProperty: string, entityId: string) => {
    try {
        const response = await fetch(`/api/qdrant?collectionName=${collectionName}&entityProperty=${entityProperty}&entityId=${entityId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to delete from Qdrant');
        }

        return await response.json();
    } catch (error) {
        console.error(`Error deleting from Qdrant (${collectionName}):`, error);
        // Don't block main flow if vector DB fails, but log it
    }
};

// ==========================================