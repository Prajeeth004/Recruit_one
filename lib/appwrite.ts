import { Client, Storage, TablesDB, Account, ID, Permission, Role, Query } from "appwrite";

// Initialize Appwrite Client
const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || '')
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '');

export const storage = new Storage(client);
export const tablesDB = new TablesDB(client);
export const account = new Account(client);

// Constants
export const DB_ID = 'recruitment_db';
export const BUCKET_ID = 'resumes';

// Authentication helper
export let isAuthenticated = false;

export const ensureAuthenticated = async () => {
    if (isAuthenticated) return;

    try {
        // Try to get current session
        await account.get();
        isAuthenticated = true;
    } catch (error) {
        // No session, create one with email/password
        const email = process.env.NEXT_PUBLIC_APPWRITE_EMAIL;
        const password = process.env.NEXT_PUBLIC_APPWRITE_PASSWORD;

        if (!email || !password) {
            throw new Error("Appwrite email and password must be set in environment variables");
        }

        try {
            await account.createEmailPasswordSession(email, password);
            isAuthenticated = true;
        } catch (loginError) {
            console.error("Failed to authenticate with Appwrite:", loginError);
            throw new Error("Failed to authenticate. Please check your credentials.");
        }
    }
};

export { ID, Permission, Role, Query, client };
