import fs from 'fs';
const lines = fs.readFileSync('lib/clientDbService.ts', 'utf8').split(/\r?\n/);

const getLines = (startStr, endStr) => {
    const start = lines.findIndex(l => l.includes(startStr));
    const end = endStr ? lines.findIndex((l, i) => i > start && l.includes(endStr)) : lines.length;
    if (start === -1) throw new Error("Start missing: " + startStr);
    if (end === -1) throw new Error("End missing: " + endStr);
    return lines.slice(start, end).join('\n');
};

const aiLines = getLines('// Helper: Convert File to Base64', '// Appwrite Services')
    .replace('const uploadToQdrant = async', 'export const uploadToQdrant = async');

const aiCode = `import { GoogleGenAI } from "@google/genai";
import mammoth from 'mammoth';

const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY || '' });

` + aiLines;

fs.mkdirSync('features/ai/services', { recursive: true });
fs.writeFileSync('features/ai/services/ai.service.ts', aiCode);

const candCode = `import { ID, Permission, Role, Query } from "appwrite";
import { storage, tablesDB, DB_ID, BUCKET_ID, ensureAuthenticated } from "../../../lib/appwrite";
import { parseResumeWithAI, generateEmbedding, uploadToQdrant } from "../../ai/services/ai.service";

` + getLines('// Helper: Validate email format', '// Helper: Convert File to Base64') + '\n' +
    getLines('export const createCandidate', 'export const createJob') + '\n' +
    getLines('export const getCandidates', 'export const getJobs') + '\n' +
    getLines('export const getCandidate = async', 'export const getJob = async') + '\n' +
    getLines('export const getResumeUrl', 'export const getJobCandidates') + '\n' +
    getLines('export const assignCandidateToJob', null);

fs.mkdirSync('features/candidates/services', { recursive: true });
fs.writeFileSync('features/candidates/services/candidate.service.ts', candCode);

const jobCode = `import { ID, Permission, Role, Query } from "appwrite";
import { tablesDB, DB_ID, ensureAuthenticated } from "../../../lib/appwrite";
import { generateEmbedding, uploadToQdrant } from "../../ai/services/ai.service";

` + getLines('export const createJob', 'export const getCandidates') + '\n' +
    getLines('export const getJobs', 'export const getCompanies') + '\n' +
    getLines('export const getJob = async', 'export const getResumeUrl') + '\n' +
    getLines('export const getJobCandidates', 'export const assignCandidateToJob');

fs.mkdirSync('features/jobs/services', { recursive: true });
fs.writeFileSync('features/jobs/services/job.service.ts', jobCode);

const compCode = `import { Query } from "appwrite";
import { tablesDB, DB_ID, ensureAuthenticated } from "../../../lib/appwrite";

` + getLines('export const getCompanies', 'export const getCandidate = async');

fs.mkdirSync('features/companies/services', { recursive: true });
fs.writeFileSync('features/companies/services/company.service.ts', compCode);
console.log('Successfully split clientDbService.ts into features');
