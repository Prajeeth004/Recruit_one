import { Query } from "appwrite";
import { tablesDB, DB_ID, ensureAuthenticated } from "../../../lib/appwrite";

export const getCompanies = async () => {
    try {
        await ensureAuthenticated();
        const result = await tablesDB.listRows({
            databaseId: DB_ID,
            tableId: 'companies',
            queries: [
                Query.orderDesc('$createdAt')
            ]
        });
        return result.rows;
    } catch (error) {
        console.error("Error fetching companies:", error);
        return [];
    }
};
