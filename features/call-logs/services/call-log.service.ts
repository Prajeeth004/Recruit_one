import { ID } from "appwrite";
import { tablesDB, DB_ID, ensureAuthenticated } from "../../../lib/appwrite";

export interface CallLog {
    $id?: string;
    vapi_call_id?: string;       // VAPI's call ID
    candidate_id?: string;
    job_id?: string;
    phone_number: string;
    direction: 'inbound' | 'outbound';
    status: 'initiated' | 'in-progress' | 'completed' | 'failed' | 'missed' | 'no-answer';
    started_at?: string;
    ended_at?: string;
    duration?: number;           // seconds
    outcome?: string;            // e.g. "interested", "not_interested", "callback"
    notes?: string;              // AI-generated summary
    transcript?: string;
    related_type?: string;       // "candidate" | "job"
    related_id?: string;
    $createdAt?: string;
}

const TABLE_ID = 'call_logs';

export const createCallLog = async (data: Omit<CallLog, '$id' | '$createdAt'>) => {
    try {
        await ensureAuthenticated();
        const result = await tablesDB.createRow({
            databaseId: DB_ID,
            tableId: TABLE_ID,
            rowId: ID.unique(),
            data
        });
        return result;
    } catch (error) {
        console.error('Error creating call log:', error);
        throw error;
    }
};

export const updateCallLog = async (id: string, data: Partial<CallLog>) => {
    try {
        await ensureAuthenticated();
        const result = await tablesDB.updateRow({
            databaseId: DB_ID,
            tableId: TABLE_ID,
            rowId: id,
            data
        });
        return result;
    } catch (error) {
        console.error(`Error updating call log ${id}:`, error);
        throw error;
    }
};

export const getCallLogByVapiId = async (vapiCallId: string) => {
    try {
        await ensureAuthenticated();
        const result = await tablesDB.listRows({
            databaseId: DB_ID,
            tableId: TABLE_ID,
        });
        // Find by vapi_call_id in the returned rows
        const rows = (result as any).rows ?? (result as any).documents ?? [];
        return rows.find((r: any) => r.vapi_call_id === vapiCallId) || null;
    } catch (error) {
        console.error(`Error fetching call log by vapi ID ${vapiCallId}:`, error);
        return null;
    }
};

export const getCallLogsByCandidate = async (candidateId: string) => {
    try {
        await ensureAuthenticated();
        const result = await tablesDB.listRows({
            databaseId: DB_ID,
            tableId: TABLE_ID,
        });
        const rows = (result as any).rows ?? (result as any).documents ?? [];
        return rows.filter((r: any) => r.candidate_id === candidateId);
    } catch (error) {
        console.error(`Error fetching call logs for candidate ${candidateId}:`, error);
        throw error;
    }
};

export const deleteCallLog = async (id: string) => {
    try {
        await ensureAuthenticated();
        await tablesDB.deleteRow({
            databaseId: DB_ID,
            tableId: TABLE_ID,
            rowId: id
        });
        return true;
    } catch (error) {
        console.error(`Error deleting call log ${id}:`, error);
        throw error;
    }
};
