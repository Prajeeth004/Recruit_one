import { ID, Permission, Role, Query } from "appwrite";
import { storage, tablesDB, DB_ID, BUCKET_ID, ensureAuthenticated } from "../../../lib/appwrite";
import { parseResumeWithAI, generateEmbedding, uploadToQdrant, deleteFromQdrant } from "../../ai/services/ai.service";

// Helper: Validate email format
const isValidEmail = (email: string | null | undefined): boolean => {
    if (!email || typeof email !== 'string') return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
};

export const createCandidate = async (candidateData: any, resumeFile?: File) => {
    try {
        await ensureAuthenticated();

        let finalCandidateData = candidateData;
        let resumeFileId = null;

        // 1. Handle Resume: Upload & Parse if needed
        if (resumeFile) {
            // Upload Resume
            const fileResult = await storage.createFile(
                BUCKET_ID,
                ID.unique(),
                resumeFile,
                [Permission.read(Role.any())]
            );
            resumeFileId = fileResult.$id;

            // Parse if data not provided
            if (!finalCandidateData) {
                finalCandidateData = await parseResumeWithAI(resumeFile);
            }
        }

        if (!finalCandidateData) {
            throw new Error("No candidate data provided and no resume to parse.");
        }

        // 2. Create Candidate Record - Map to schema fields
        const candidateId = ID.unique();

        // Helper function to normalize URL fields (returns valid URL string or undefined to omit field)
        const normalizeUrl = (url: string | null | undefined): string | undefined => {
            // Handle null, undefined, or non-string values
            if (url === null || url === undefined || typeof url !== 'string') {
                return undefined;
            }
            const trimmed = url.trim();
            // Handle empty strings
            if (trimmed === '') {
                return undefined;
            }
            // Basic URL validation - must start with http:// or https://
            if (!trimmed.match(/^https?:\/\//i)) {
                return undefined;
            }
            return trimmed;
        };

        // Helper to safely extract URL from multiple possible locations
        const extractUrl = (socialProfilesUrl: string | null | undefined, directUrl: string | null | undefined): string | undefined => {
            // Check socialProfiles first, but skip empty strings
            const url1 = socialProfilesUrl && typeof socialProfilesUrl === 'string' && socialProfilesUrl.trim() !== ''
                ? socialProfilesUrl
                : null;
            // Check direct property, but skip empty strings
            const url2 = directUrl && typeof directUrl === 'string' && directUrl.trim() !== ''
                ? directUrl
                : null;
            // Use first non-empty value, or undefined
            return normalizeUrl(url1 || url2);
        };

        // Get normalized URL values
        const linkedinUrl = extractUrl(
            finalCandidateData.socialProfiles?.linkedinUrl,
            finalCandidateData.linkedin
        );
        const githubUrl = extractUrl(
            finalCandidateData.socialProfiles?.githubUrl,
            finalCandidateData.github
        );
        const portfolioUrl = extractUrl(
            finalCandidateData.socialProfiles?.portfolioUrl,
            finalCandidateData.portfolio
        );

        // Map form data to schema fields
        const candidateRecord: any = {
            firstName: finalCandidateData.firstName,
            lastName: finalCandidateData.lastName,
            email: isValidEmail(finalCandidateData.email)
                ? finalCandidateData.email
                : `candidate.${finalCandidateData.firstName?.toLowerCase() || 'unknown'}${finalCandidateData.lastName?.toLowerCase() || 'user'}@placeholder.com`, // Fallback email
            phone: finalCandidateData.phone || null,
            date_of_birth: finalCandidateData.dateOfBirth || finalCandidateData.date_of_birth || null,
            city: finalCandidateData.city || null,
            state: finalCandidateData.state || null,
            country: finalCandidateData.country || null,
            postal_code: finalCandidateData.postalCode || finalCandidateData.postal_code || null,
            address: finalCandidateData.fullAddress || finalCandidateData.address || null,
            resume_file_id: resumeFileId,
            skills: finalCandidateData.skills || [],
            languages: finalCandidateData.languageSkills?.map((l: any) => l.language) || finalCandidateData.languages || [],
            title: finalCandidateData.employmentInfo?.currentTitle || finalCandidateData.title || null,
            summary: finalCandidateData.summary || null,
            total_experience: finalCandidateData.employmentInfo?.totalExperienceYears || finalCandidateData.total_experience || null,
            relevant_experience: finalCandidateData.employmentInfo?.relevantExperienceYears || finalCandidateData.relevant_experience || null,
            current_organization: finalCandidateData.employmentInfo?.currentOrganization || finalCandidateData.current_organization || null,
            current_salary: finalCandidateData.employmentInfo?.currentSalary || finalCandidateData.current_salary || null,
            expected_salary: finalCandidateData.employmentInfo?.salaryExpectation || finalCandidateData.expected_salary || null,
            currency: finalCandidateData.employmentInfo?.currencyType || finalCandidateData.currency || null,
            notice_period: finalCandidateData.employmentInfo?.noticePeriodDays || finalCandidateData.notice_period || null,
            available_from: finalCandidateData.employmentInfo?.availableFrom || finalCandidateData.available_from || null,
            willing_to_relocate: finalCandidateData.willingToRelocate || finalCandidateData.willing_to_relocate || null,
            source: finalCandidateData.source || null,
            hotlist: finalCandidateData.hotlist || false,
            opt_out: finalCandidateData.opt_out || false,
            owner_id: finalCandidateData.owner_id || finalCandidateData.ownerId || null,
            embedding_id: null,
            gender: finalCandidateData.gender || null,
            employment_status: finalCandidateData.employmentInfo?.currentEmploymentStatus || finalCandidateData.employment_status || null
        };

        // Set URL fields - use valid URL if available, otherwise explicitly set to null
        // Appwrite requires URL fields to be either a valid URL or null (not omitted or empty string)
        candidateRecord.linkedin = linkedinUrl !== undefined && linkedinUrl !== '' ? linkedinUrl : null;
        candidateRecord.github = githubUrl !== undefined && githubUrl !== '' ? githubUrl : null;
        candidateRecord.portfolio = portfolioUrl !== undefined && portfolioUrl !== '' ? portfolioUrl : null;

        // Final safety check: ensure no empty strings made it through
        if (candidateRecord.linkedin === '') candidateRecord.linkedin = null;
        if (candidateRecord.github === '') candidateRecord.github = null;
        if (candidateRecord.portfolio === '') candidateRecord.portfolio = null;

        const record = await tablesDB.createRow({
            databaseId: DB_ID,
            tableId: 'candidates',
            rowId: candidateId,
            data: candidateRecord,
            permissions: [Permission.read(Role.any()), Permission.write(Role.any())]
        });

        // 3. Generate & Upload Embedding
        // Construct rich text for embedding
        const workHistoryText = finalCandidateData.workHistory?.map((w: any) =>
            `${w.jobTitle} at ${w.company} (${w.startDate} - ${w.endDate}): ${w.description}`
        ).join('. ') || '';

        const educationText = finalCandidateData.education?.map((e: any) =>
            `${e.degree || e.educationalQualification} from ${e.institution}`
        ).join('. ') || '';

        const textToEmbed = [
            finalCandidateData.firstName,
            finalCandidateData.lastName,
            finalCandidateData.summary,
            `Skills: ${finalCandidateData.skills?.join(', ')}`,
            `Experience: ${workHistoryText}`,
            `Education: ${educationText}`,
            `Current Role: ${finalCandidateData.employmentInfo?.currentTitle} at ${finalCandidateData.employmentInfo?.currentOrganization}`
        ].filter(Boolean).join('. ');

        const embedding = await generateEmbedding(textToEmbed);
        const qdrantId = crypto.randomUUID();

        await uploadToQdrant('candidate_embeddings', qdrantId, embedding, {
            candidate_id: candidateId,
            name: `${finalCandidateData.firstName} ${finalCandidateData.lastName}`,
            skills: finalCandidateData.skills,
            experience_years: finalCandidateData.employmentInfo?.totalExperienceYears
        });

        return record;
    } catch (error) {
        console.error("Error creating candidate:", error);
        throw error;
    }
};

export const getCandidates = async () => {
    try {
        await ensureAuthenticated();

        // Appwrite default page size is 25 — paginate to fetch ALL candidates
        const pageSize = 100;
        let offset = 0;
        const allRows: any[] = [];

        while (true) {
            const result = await tablesDB.listRows({
                databaseId: DB_ID,
                tableId: 'candidates',
                queries: [
                    Query.orderDesc('$createdAt'),
                    Query.limit(pageSize),
                    Query.offset(offset),
                ],
            });

            const rows = result.rows ?? [];
            allRows.push(...rows);

            if (rows.length < pageSize) break; // last page reached
            offset += pageSize;
        }

        return allRows;
    } catch (error) {
        console.error("Error fetching candidates:", error);
        return [];
    }
};

export const getCandidate = async (id: string) => {
    try {
        await ensureAuthenticated();
        const result = await tablesDB.getRow({
            databaseId: DB_ID,
            tableId: 'candidates',
            rowId: id
        });
        return result;
    } catch (error) {
        console.error(`Error fetching candidate ${id}:`, error);
        return null;
    }
};

export const getResumeUrl = async (resumeFileId: string) => {
    try {
        await ensureAuthenticated();

        if (!resumeFileId) {
            throw new Error("No resume file ID provided");
        }

        // Get file view URL from Appwrite Storage
        const url = storage.getFileView(BUCKET_ID, resumeFileId);
        return url;
    } catch (error) {
        console.error("Error getting resume URL:", error);
        throw error;
    }
};

export const assignCandidateToJob = async (candidateId: string, jobId: string) => {
    try {
        await ensureAuthenticated();

        // 1. Get the job to find the pipeline_id
        const job = await tablesDB.getRow({
            databaseId: DB_ID,
            tableId: 'jobs',
            rowId: jobId
        });

        if (!job) throw new Error("Job not found");

        let pipelineId = job.pipeline_id;

        // Fallback: If no pipeline assigned, get the first available pipeline
        if (!pipelineId) {
            console.warn(`Job ${jobId} has no pipeline_id. Fetching default pipeline.`);
            const pipelines = await tablesDB.listRows({
                databaseId: DB_ID,
                tableId: 'hiring_pipelines',
                queries: [
                    Query.limit(1)
                ]
            });

            if (pipelines.rows.length > 0) {
                pipelineId = pipelines.rows[0].$id;
            } else {
                console.log("No pipelines found. Creating default pipeline...");
                // Create default pipeline
                const newPipeline = await tablesDB.createRow({
                    databaseId: DB_ID,
                    tableId: 'hiring_pipelines',
                    rowId: ID.unique(),
                    data: {
                        name: 'Default Pipeline',
                        description: 'Standard hiring pipeline'
                    }
                });
                pipelineId = newPipeline.$id;

                // Create default stages
                const defaultStages = [
                    { name: 'Screening', type: 'screening', order: 1 },
                    { name: 'Interview', type: 'interview', order: 2 },
                    { name: 'Offer', type: 'offer', order: 3 },
                    { name: 'Hired', type: 'hired', order: 4 },
                    { name: 'Rejected', type: 'rejected', order: 5 }
                ];

                for (const stage of defaultStages) {
                    await tablesDB.createRow({
                        databaseId: DB_ID,
                        tableId: 'pipeline_stages',
                        rowId: ID.unique(),
                        data: {
                            pipeline_id: pipelineId,
                            name: stage.name,
                            type: stage.type,
                            order: stage.order
                        }
                    });
                }
            }
        }

        // 2. Get the first stage of the pipeline
        const stages = await tablesDB.listRows({
            databaseId: DB_ID,
            tableId: 'pipeline_stages',
            queries: [
                Query.equal('pipeline_id', pipelineId),
                Query.orderAsc('order'),
                Query.limit(1)
            ]
        });

        if (stages.rows.length === 0) throw new Error("Pipeline has no stages");
        const firstStageId = stages.rows[0].$id;

        // 3. Create the application record
        const application = await tablesDB.createRow({
            databaseId: DB_ID,
            tableId: 'applications',
            rowId: ID.unique(),
            data: {
                candidate_id: candidateId,
                job_id: jobId,
                pipeline_id: pipelineId,
                current_stage_id: firstStageId,
                assigned_at: new Date().toISOString(),
                // assigned_by: 'current_user_id' // TODO: Get current user ID
            }
        });

        return application;
    } catch (error) {
        console.error("Error assigning candidate to job:", error);
        throw error;
    }
};

export const updateCandidate = async (id: string, candidateData: any) => {
    try {
        await ensureAuthenticated();
        const result = await tablesDB.updateRow({
            databaseId: DB_ID,
            tableId: 'candidates',
            rowId: id,
            data: candidateData
        });
        return result;
    } catch (error) {
        console.error(`Error updating candidate ${id}:`, error);
        throw error;
    }
};

export const deleteCandidate = async (id: string) => {
    try {
        await ensureAuthenticated();

        // Delete from Qdrant first (non-blocking if it fails, but good to try first)
        await deleteFromQdrant('candidate_embeddings', 'candidate_id', id).catch((err: any) => {
            console.error('Failed to delete candidate embedding from Qdrant, but proceeding with DB deletion:', err);
        });

        await tablesDB.deleteRow({
            databaseId: DB_ID,
            tableId: 'candidates',
            rowId: id
        });
        return true;
    } catch (error) {
        console.error(`Error deleting candidate ${id}:`, error);
        throw error;
    }
};
