import { Client, TablesDB, Storage, Permission, Role, IndexType } from 'node-appwrite';
import dotenv from 'dotenv';
dotenv.config();

const endpoint = process.env.APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1';
const projectId = process.env.APPWRITE_PROJECT_ID;
const apiKey = process.env.APPWRITE_API_KEY;

console.log('APPWRITE_ENDPOINT from env:', process.env.APPWRITE_ENDPOINT);
console.log('Final endpoint variable:', JSON.stringify(endpoint));

const client = new Client()
    .setEndpoint(endpoint)
    .setProject(projectId)
    .setKey(apiKey);

const db = new TablesDB(client);
const storage = new Storage(client);
const DB_ID = 'recruitment_db';

const defaultPerms = [
    Permission.read(Role.any()),
    Permission.create(Role.users()),
    Permission.update(Role.users()),
    Permission.delete(Role.users())
];

const schema = {
    companies: {
        columns: [
            { type: 'string', key: 'name', size: 255, required: true },
            { type: 'string', key: 'industry', size: 255 },
            { type: 'url', key: 'website' },
            { type: 'string', key: 'address', size: 500 },
            { type: 'string', key: 'city', size: 100 },
            { type: 'string', key: 'state', size: 100 },
            { type: 'string', key: 'country', size: 100 },
            { type: 'string', key: 'owner_id', size: 36 },
            { type: 'boolean', key: 'hotlist', default: false }
        ],
        indexes: [
            { key: 'name_idx', columns: ['name'] },
            { key: 'city_idx', columns: ['city'] },
            { key: 'owner_idx', columns: ['owner_id'] }
        ]
    },
    contacts: {
        columns: [
            { type: 'string', key: 'name', size: 255, required: true },
            { type: 'email', key: 'email' },
            { type: 'string', key: 'phone', size: 50 },
            { type: 'string', key: 'title', size: 255 },
            { type: 'string', key: 'company_id', size: 36 },
            { type: 'string', key: 'city', size: 100 },
            { type: 'string', key: 'address', size: 500 },
            { type: 'url', key: 'linkedin' },
            { type: 'url', key: 'facebook' },
            { type: 'url', key: 'twitter' },
            { type: 'string', key: 'owner_id', size: 36 }
        ],
        indexes: [
            { key: 'email_idx', columns: ['email'] },
            { key: 'company_idx', columns: ['company_id'] }
        ]
    },
    jobs: {
        columns: [
            { type: 'string', key: 'title', size: 255, required: true },
            { type: 'enum', key: 'status', elements: ['open', 'on_hold', 'closed', 'cancelled'] },
            { type: 'string', key: 'company_id', size: 36, required: true },
            { type: 'string', key: 'contact_id', size: 36 },
            { type: 'string', key: 'description', size: 10000 },
            { type: 'string', key: 'city', size: 100 },
            { type: 'string', key: 'locality', size: 255 },
            { type: 'string', key: 'address', size: 500 },
            { type: 'string', key: 'postal_code', size: 20 },
            { type: 'enum', key: 'location_type', elements: ['remote', 'onsite', 'hybrid'] },
            { type: 'integer', key: 'min_experience' },
            { type: 'integer', key: 'max_experience' },
            { type: 'integer', key: 'min_salary' },
            { type: 'integer', key: 'max_salary' },
            { type: 'string', key: 'currency', size: 10, default: 'INR' },
            { type: 'integer', key: 'openings', default: 1 },
            { type: 'string', key: 'skills', size: 2000, array: true },
            { type: 'string', key: 'owner_id', size: 36 },
            { type: 'string', key: 'pipeline_id', size: 36 }, // Default pipeline for this job
            { type: 'string', key: 'embedding_id', size: 100 }
        ],
        indexes: [
            { key: 'title_idx', columns: ['title'] },
            { key: 'status_idx', columns: ['status'] },
            { key: 'company_idx', columns: ['company_id'] },
            { key: 'city_idx', columns: ['city'] },
            { key: 'pipeline_idx', columns: ['pipeline_id'] },
            { key: 'embedding_idx', columns: ['embedding_id'] }
        ]
    },
    candidates: {
        columns: [
            { type: 'string', key: 'firstName', size: 255, required: true },
            { type: 'string', key: 'lastName', size: 255, required: true },
            { type: 'email', key: 'email', required: true },
            { type: 'string', key: 'phone', size: 50 },
            { type: 'enum', key: 'gender', elements: ['male', 'female', 'other', 'prefer_not_to_say'] },
            { type: 'datetime', key: 'date_of_birth' },
            { type: 'string', key: 'city', size: 100 },
            { type: 'string', key: 'state', size: 100 },
            { type: 'string', key: 'country', size: 100 },
            { type: 'string', key: 'postal_code', size: 20 },
            { type: 'string', key: 'address', size: 500 },
            { type: 'string', key: 'resume_file_id', size: 36 },
            { type: 'url', key: 'linkedin' },
            { type: 'url', key: 'github' },
            { type: 'url', key: 'portfolio' },
            { type: 'string', key: 'skills', size: 2000, array: true },
            { type: 'string', key: 'languages', size: 2000, array: true },
            { type: 'string', key: 'title', size: 255 },
            { type: 'string', key: 'summary', size: 5000 },
            { type: 'float', key: 'total_experience' },
            { type: 'float', key: 'relevant_experience' },
            { type: 'string', key: 'current_organization', size: 255 },
            { type: 'integer', key: 'current_salary' },
            { type: 'integer', key: 'expected_salary' },
            { type: 'string', key: 'currency', size: 10, default: 'INR' },
            { type: 'enum', key: 'employment_status', elements: ['employed', 'unemployed', 'notice_period'] },
            { type: 'integer', key: 'notice_period' },
            { type: 'datetime', key: 'available_from' },
            { type: 'boolean', key: 'willing_to_relocate' },
            { type: 'string', key: 'source', size: 255 },
            { type: 'boolean', key: 'hotlist', default: false },
            { type: 'boolean', key: 'opt_out', default: false },
            { type: 'string', key: 'owner_id', size: 36 },
            { type: 'string', key: 'embedding_id', size: 100 }
        ],
        indexes: [
            { key: 'email_idx', columns: ['email'], type: 'unique' },
            { key: 'firstName_idx', columns: ['firstName'] },
            { key: 'lastName_idx', columns: ['lastName'] },
            { key: 'city_idx', columns: ['city'] },
            { key: 'hotlist_idx', columns: ['hotlist'], orders: ['DESC'] },
            { key: 'embedding_idx', columns: ['embedding_id'] }
        ]
    },
    applications: {
        columns: [
            { type: 'string', key: 'candidate_id', size: 36, required: true },
            { type: 'string', key: 'job_id', size: 36, required: true },
            { type: 'string', key: 'pipeline_id', size: 36, required: true },
            { type: 'string', key: 'current_stage_id', size: 36, required: true },
            { type: 'string', key: 'assigned_by', size: 36 },
            { type: 'datetime', key: 'assigned_at' },
            { type: 'string', key: 'notes', size: 2000 },

            // AI / rule-based ranking fields (candidate ↔ job)
            { type: 'float', key: 'match_score' }, // 0..100
            { type: 'datetime', key: 'scored_at' },
            { type: 'string', key: 'score_method', size: 50 }, // e.g. "embedding" | "rules"
            { type: 'string', key: 'score_details', size: 5000 } // JSON string for explainability
        ],
        indexes: [
            { key: 'candidate_idx', columns: ['candidate_id'] },
            { key: 'job_idx', columns: ['job_id'] },
            { key: 'pipeline_idx', columns: ['pipeline_id'] },
            { key: 'stage_idx', columns: ['current_stage_id'] },
            { key: 'match_score_idx', columns: ['match_score'], orders: ['DESC'] },
            { key: 'composite_idx', columns: ['candidate_id', 'job_id'], type: 'unique' }
        ]
    },
    hiring_pipelines: {
        columns: [
            { type: 'string', key: 'name', size: 255, required: true },
            { type: 'string', key: 'description', size: 1000 }
        ],
        indexes: [
            { key: 'name_idx', columns: ['name'] }
        ]
    },
    pipeline_stages: {
        columns: [
            { type: 'string', key: 'pipeline_id', size: 36, required: true },
            { type: 'string', key: 'name', size: 255, required: true },
            { type: 'integer', key: 'order', required: true },
            { type: 'enum', key: 'type', elements: ['screening', 'interview', 'assessment', 'offer', 'hired', 'rejected'] }
        ],
        indexes: [
            { key: 'pipeline_idx', columns: ['pipeline_id'] },
            { key: 'order_idx', columns: ['pipeline_id', 'order'] }
        ]
    },
    stage_history: {
        columns: [
            { type: 'string', key: 'candidate_id', size: 36, required: true },
            { type: 'string', key: 'job_id', size: 36, required: true },
            { type: 'string', key: 'stage_id', size: 36, required: true },
            { type: 'datetime', key: 'entered_at', required: true },
            { type: 'datetime', key: 'exited_at' },
            { type: 'string', key: 'notes', size: 1000 },
            { type: 'string', key: 'moved_by', size: 36 }
        ],
        indexes: [
            { key: 'candidate_job_idx', columns: ['candidate_id', 'job_id'] },
            { key: 'stage_idx', columns: ['stage_id'] },
            { key: 'entered_at_idx', columns: ['entered_at'], orders: ['DESC'] },
            { key: 'full_journey_idx', columns: ['candidate_id', 'job_id', 'stage_id'] }
        ]
    },
    tasks: {
        columns: [
            { type: 'string', key: 'title', size: 255, required: true },
            { type: 'string', key: 'description', size: 2000 },
            { type: 'enum', key: 'type', elements: ['call', 'email', 'meeting', 'reminder', 'follow_up'] },
            { type: 'datetime', key: 'due_date', required: true },
            { type: 'enum', key: 'status', elements: ['pending', 'completed', 'overdue', 'cancelled'] },
            { type: 'enum', key: 'priority', elements: ['low', 'medium', 'high', 'urgent'] },
            { type: 'string', key: 'owner_id', size: 36, required: true },
            { type: 'enum', key: 'related_type', elements: ['candidate', 'job', 'company', 'contact'] },
            { type: 'string', key: 'related_id', size: 36 }
        ],
        indexes: [
            { key: 'due_date_idx', columns: ['due_date'] },
            { key: 'owner_idx', columns: ['owner_id'] },
            { key: 'status_idx', columns: ['status'] }
        ]
    },
    opportunities: {
        columns: [
            { type: 'string', key: 'name', size: 255, required: true },
            { type: 'string', key: 'job_id', size: 36 },
            { type: 'string', key: 'candidate_id', size: 36 },
            { type: 'enum', key: 'status', elements: ['open', 'in_progress', 'won', 'lost', 'on_hold', 'cancelled'] },
            { type: 'integer', key: 'amount' },
            { type: 'integer', key: 'split_amount' },
            { type: 'integer', key: 'weighted_value' },
            { type: 'integer', key: 'probability', min: 0, max: 100 },
            { type: 'string', key: 'currency', size: 10, default: 'INR' },
            { type: 'datetime', key: 'expected_close_date' },
            { type: 'string', key: 'owner_id', size: 36 }
        ],
        indexes: [
            { key: 'status_idx', columns: ['status'] },
            { key: 'owner_idx', columns: ['owner_id'] }
        ]
    },
    work_history: {
        columns: [
            { type: 'string', key: 'candidate_id', size: 36, required: true },
            { type: 'string', key: 'company', size: 255, required: true },
            { type: 'string', key: 'title', size: 255, required: true },
            { type: 'datetime', key: 'start_date', required: true },
            { type: 'datetime', key: 'end_date' },
            { type: 'boolean', key: 'is_current', default: false },
            { type: 'string', key: 'description', size: 2000 }
        ],
        indexes: [
            { key: 'candidate_idx', columns: ['candidate_id'] }
        ]
    },
    education_history: {
        columns: [
            { type: 'string', key: 'candidate_id', size: 36, required: true },
            { type: 'string', key: 'institution', size: 255, required: true },
            { type: 'string', key: 'degree', size: 255, required: true },
            { type: 'string', key: 'field_of_study', size: 255 },
            { type: 'datetime', key: 'start_date' },
            { type: 'datetime', key: 'end_date' },
            { type: 'string', key: 'grade', size: 50 }
        ],
        indexes: [
            { key: 'candidate_idx', columns: ['candidate_id'] }
        ]
    },
    call_logs: {
        columns: [
            { type: 'string', key: 'phone_number', size: 50 },
            { type: 'enum', key: 'direction', elements: ['inbound', 'outbound'] },
            { type: 'enum', key: 'status', elements: ['completed', 'missed', 'no_answer', 'busy', 'failed'] },
            { type: 'datetime', key: 'started_at' },
            { type: 'datetime', key: 'ended_at' },
            { type: 'integer', key: 'duration' }, // in seconds
            { type: 'enum', key: 'outcome', elements: ['interested', 'not_interested', 'follow_up_required', 'voicemail', 'callback_requested', 'not_reachable'] },
            { type: 'string', key: 'notes', size: 2000 },
            { type: 'string', key: 'recording_url', size: 255 },
            { type: 'enum', key: 'related_type', elements: ['candidate', 'contact', 'company'] },
            { type: 'string', key: 'related_id', size: 36 },
            { type: 'string', key: 'owner_id', size: 36 }
        ],
        indexes: [
            { key: 'started_at_idx', columns: ['started_at'], orders: ['DESC'] },
            { key: 'status_idx', columns: ['status'] },
            { key: 'related_idx', columns: ['related_type', 'related_id'] },
            { key: 'owner_idx', columns: ['owner_id'] }
        ]
    },
    email_logs: {
        columns: [
            { type: 'string', key: 'subject', size: 500 },
            { type: 'string', key: 'body', size: 10000 },
            { type: 'email', key: 'from_email' },
            { type: 'email', key: 'to_email' },
            { type: 'enum', key: 'status', elements: ['sent', 'opened', 'replied', 'failed', 'scheduled'] },
            { type: 'datetime', key: 'sent_at' },
            { type: 'datetime', key: 'opened_at' },
            { type: 'datetime', key: 'replied_at' },
            { type: 'enum', key: 'related_type', elements: ['candidate', 'contact', 'company'] },
            { type: 'string', key: 'related_id', size: 36 },
            { type: 'string', key: 'owner_id', size: 36 }
        ],
        indexes: [
            { key: 'status_idx', columns: ['status'] },
            { key: 'sent_at_idx', columns: ['sent_at'], orders: ['DESC'] }
        ]
    },
    activity_logs: {
        columns: [
            { type: 'string', key: 'action', size: 255 },
            { type: 'enum', key: 'entity_type', elements: ['candidate', 'job', 'company', 'contact', 'deal'] },
            { type: 'string', key: 'entity_id', size: 36 },
            { type: 'string', key: 'changes', size: 5000 },
            { type: 'string', key: 'performed_by', size: 36 }
        ],
        indexes: [
            { key: 'created_at_idx', columns: ['$createdAt'], orders: ['DESC'] }
        ]
    }
};

async function createColumn(tableId, col) {
    const base = { databaseId: DB_ID, tableId, key: col.key, required: col.required || false };
    const ops = {
        string: () => db.createStringColumn({ ...base, size: col.size, default: col.default, array: col.array, encrypt: col.encrypt }),
        email: () => db.createEmailColumn({ ...base, default: col.default, array: col.array }),
        url: () => db.createUrlColumn({ ...base, default: col.default, array: col.array }),
        datetime: () => db.createDatetimeColumn({ ...base, default: col.default }),
        boolean: () => db.createBooleanColumn({ ...base, default: col.default, array: col.array }),
        enum: () => db.createEnumColumn({ ...base, elements: col.elements, default: col.default, array: col.array }),
        integer: () => db.createIntegerColumn({ ...base, min: col.min, max: col.max, default: col.default, array: col.array }),
        float: () => db.createFloatColumn({ ...base, min: col.min, max: col.max, default: col.default, array: col.array })
    };
    await ops[col.type]();
}

async function createTable(tableId, name, config) {
    console.log(`Creating ${name} table...`);
    try {
        await db.createTable({ databaseId: DB_ID, tableId, name, permissions: defaultPerms, rowSecurity: true, enabled: true });

        for (const col of config.columns) {
            await createColumn(tableId, col);
        }

        for (const idx of config.indexes) {
            await db.createIndex({
                databaseId: DB_ID,
                tableId,
                key: idx.key,
                type: idx.type === 'unique' ? IndexType.Unique : IndexType.Key,
                columns: idx.columns,
                orders: idx.orders || idx.columns.map(() => 'ASC')
            });
        }

        console.log(`${name} table created`);
    } catch (error) {
        console.error(`Error creating ${name}:`, error.message);
    }
}

async function createBucket() {
    console.log('Creating resumes bucket...');
    try {
        await storage.createBucket({
            bucketId: 'resumes',
            name: 'Resumes',
            permissions: [
                Permission.read(Role.users()),
                Permission.create(Role.users()),
                Permission.update(Role.users()),
                Permission.delete(Role.users())
            ],
            fileSecurity: true,
            enabled: true,
            maximumFileSize: 10 * 1024 * 1024, // 10MB
            allowedFileExtensions: ['pdf', 'doc', 'docx'],
            compression: 'gzip',
            encryption: true,
            antivirus: true
        });
        console.log('Resumes bucket created\n');
    } catch (error) {
        if (error.code === 409) {
            console.log('Resumes bucket exists, skipping...\n');
        } else {
            console.error('Error creating bucket:', error.message);
        }
    }
}

async function deleteTable(tableId, name) {
    try {
        await db.deleteTable({ databaseId: DB_ID, tableId });
        console.log(`Deleted ${name} table`);
    } catch (error) {
        if (error.code !== 404) {
            console.error(`Error deleting ${name}:`, error.message);
        }
    }
}

async function deleteBucket(bucketId, name) {
    try {
        await storage.deleteBucket({ bucketId });
        console.log(`Deleted ${name} bucket`);
    } catch (error) {
        if (error.code !== 404) {
            console.error(`Error deleting ${name}:`, error.message);
        }
    }
}

async function flushAll() {
    console.log('Flushing all tables and buckets...\n');

    const tables = {
        activity_logs: 'Activity Logs',
        email_logs: 'Email Logs',
        call_logs: 'Call Logs',
        stage_history: 'Stage History',
        pipeline_stages: 'Pipeline Stages',
        hiring_pipelines: 'Hiring Pipelines',
        education_history: 'Education History',
        work_history: 'Work History',
        opportunities: 'Opportunities',
        tasks: 'Tasks',
        applications: 'Applications',
        candidates: 'Candidates',
        jobs: 'Jobs',
        contacts: 'Contacts',
        companies: 'Companies'
    };

    // Delete tables in reverse order to handle dependencies
    for (const [id, name] of Object.entries(tables)) {
        await deleteTable(id, name);
    }

    // Delete bucket
    await deleteBucket('resumes', 'Resumes');

    console.log('\nFlush completed\n');
}

async function setup() {
    const shouldFlush = true;

    if (shouldFlush) {
        await flushAll();
    }

    console.log('Starting Appwrite schema setup...\n');

    try {
        await db.create({ databaseId: DB_ID, name: 'Recruitment Platform Database', enabled: true });
        console.log('Database created\n');
    } catch (error) {
        if (error.code === 409) console.log('Database exists, continuing...\n');
        else throw error;
    }

    // Create storage bucket
    await createBucket();

    const tables = {
        companies: 'Companies',
        contacts: 'Contacts',
        jobs: 'Jobs',
        candidates: 'Candidates',
        applications: 'Applications',
        hiring_pipelines: 'Hiring Pipelines',
        pipeline_stages: 'Pipeline Stages',
        stage_history: 'Stage History',
        tasks: 'Tasks',
        opportunities: 'Opportunities',
        work_history: 'Work History',
        education_history: 'Education History',
        call_logs: 'Call Logs',
        email_logs: 'Email Logs',
        activity_logs: 'Activity Logs'
    };

    for (const [id, name] of Object.entries(tables)) {
        await createTable(id, name, schema[id]);
    }

    console.log('\nSchema setup completed');
}

setup().catch(console.error);
