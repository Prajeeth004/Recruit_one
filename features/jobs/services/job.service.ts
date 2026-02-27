import { ID, Permission, Role, Query } from "appwrite";
import { tablesDB, DB_ID, ensureAuthenticated } from "../../../lib/appwrite";
import { generateEmbedding, uploadToQdrant, deleteFromQdrant } from "../../ai/services/ai.service";

export const createJob = async (jobData: any) => {
    try {
        await ensureAuthenticated();

        const jobId = ID.unique();

        // Map form data to schema fields
        const jobRecord = {
            title: jobData.title,
            status: jobData.status || 'Open',
            company_id: jobData.company_id || jobData.companyId || null,
            contact_id: jobData.contact_id || jobData.contactId || null,
            description: jobData.jobDescription || jobData.description || null,
            city: jobData.city || null,
            locality: jobData.locality || null,
            address: jobData.fullAddress || jobData.address || null,
            postal_code: jobData.postalCode || jobData.postal_code || null,
            location_type: jobData.jobLocationType || jobData.location_type || null,
            min_experience: jobData.minExperience || jobData.min_experience || null,
            max_experience: jobData.maxExperience || jobData.max_experience || null,
            min_salary: jobData.minSalary || jobData.min_salary || null,
            max_salary: jobData.maxSalary || jobData.max_salary || null,
            currency: jobData.currency || jobData.currencyType || null,
            openings: jobData.openings || null,
            skills: jobData.keywords ? jobData.keywords.split(',').map((s: string) => s.trim()) : (jobData.skills || []),
            owner_id: jobData.owner_id || jobData.ownerId || null,
            pipeline_id: jobData.pipeline_id || jobData.pipelineId || jobData.hiringPipeline || null,
            embedding_id: null, // Will be set after creating embedding
        };

        // 1. Create Job Record
        const record = await tablesDB.createRow({
            databaseId: DB_ID,
            tableId: 'jobs',
            rowId: jobId,
            data: jobRecord,
            permissions: [Permission.read(Role.any()), Permission.write(Role.any())]
        });

        // 2. Generate & Upload Embedding
        // Construct a rich text representation for embedding to improve search relevance
        const textToEmbed = [
            jobData.title,
            jobData.description,
            jobData.skills?.join(', '),
            `Company: ${jobData.company || jobData.company_name}`,
            `Experience: ${jobData.minExperience || jobData.min_experience} - ${jobData.maxExperience || jobData.max_experience} years`,
            `Salary: ${jobData.minSalary || jobData.min_salary} - ${jobData.maxSalary || jobData.max_salary} ${jobData.currency || jobData.currencyType}`
        ].filter(Boolean).join('. ');

        const embedding = await generateEmbedding(textToEmbed);
        const qdrantId = crypto.randomUUID();

        await uploadToQdrant('job_embeddings', qdrantId, embedding, {
            job_id: jobId,
            title: jobData.title,
            skills: jobData.skills,
            company: jobData.company || jobData.company_name
        });

        return record;
    } catch (error) {
        console.error("Error creating job:", error);
        throw error;
    }
};

export const getJobs = async () => {
    try {
        await ensureAuthenticated();
        const result = await tablesDB.listRows({
            databaseId: DB_ID,
            tableId: 'jobs',
            queries: [
                Query.orderDesc('$createdAt')
            ]
        });
        return result.rows;
    } catch (error) {
        console.error("Error fetching jobs:", error);
        return [];
    }
};

export const getJob = async (id: string) => {
    try {
        await ensureAuthenticated();
        const result = await tablesDB.getRow({
            databaseId: DB_ID,
            tableId: 'jobs',
            rowId: id
        });
        return result;
    } catch (error) {
        console.error(`Error fetching job ${id}:`, error);
        return null;
    }
};

export const getJobCandidates = async (jobId: string) => {
    try {
        await ensureAuthenticated();
        // Fetch applications for this job
        const applications = await tablesDB.listRows({
            databaseId: DB_ID,
            tableId: 'applications',
            queries: [
                Query.equal('job_id', jobId)
            ]
        });

        if (applications.rows.length === 0) {
            return [];
        }

        // Fetch candidate details for each application
        const candidatePromises = applications.rows.map(async (app: any) => {
            try {
                const candidate = await tablesDB.getRow({
                    databaseId: DB_ID,
                    tableId: 'candidates',
                    rowId: app.candidate_id
                });
                // Merge application data with candidate data
                return {
                    ...candidate,
                    application: app,
                    status: app.status || 'Applied', // Use application status if available
                    matchScore: candidate.matchScore || 0 // Preserve match score if it exists
                };
            } catch (e) {
                console.error(`Failed to fetch candidate ${app.candidate_id}`, e);
                return null;
            }
        });

        const candidates = await Promise.all(candidatePromises);
        return candidates.filter(c => c !== null);
    } catch (error) {
        console.error(`Error fetching candidates for job ${jobId}:`, error);
        return [];
    }
};

export const updateJob = async (id: string, jobData: any) => {
    try {
        await ensureAuthenticated();
        const result = await tablesDB.updateRow({
            databaseId: DB_ID,
            tableId: 'jobs',
            rowId: id,
            data: jobData
        });
        return result;
    } catch (error) {
        console.error(`Error updating job ${id}:`, error);
        throw error;
    }
};

export const deleteJob = async (id: string) => {
    try {
        await ensureAuthenticated();

        // Delete from Qdrant first
        await deleteFromQdrant('job_embeddings', 'job_id', id).catch((err: any) => {
            console.error('Failed to delete job embedding from Qdrant, but proceeding with DB deletion:', err);
        });

        await tablesDB.deleteRow({
            databaseId: DB_ID,
            tableId: 'jobs',
            rowId: id
        });
        return true;
    } catch (error) {
        console.error(`Error deleting job ${id}:`, error);
        throw error;
    }
};
