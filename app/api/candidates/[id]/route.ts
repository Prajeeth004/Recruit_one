import { NextRequest, NextResponse } from 'next/server';
import { Client, TablesDB } from 'node-appwrite';

// Initialize Appwrite client
const endpoint = process.env.APPWRITE_ENDPOINT || process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || '';
const projectId = process.env.APPWRITE_PROJECT_ID || process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '';
const apiKey = process.env.APPWRITE_API_KEY || '';

const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
const tablesDB = new TablesDB(client);

const DB_ID = 'recruitment';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const candidateId = params.id;
        
        if (!candidateId) {
            return NextResponse.json(
                { error: 'Candidate ID is required' },
                { status: 400 }
            );
        }

        console.log(`🔍 Fetching candidate details for ID: ${candidateId}`);

        const result = await tablesDB.getRow({
            databaseId: DB_ID,
            tableId: 'candidates',
            rowId: candidateId
        });

        console.log(`✅ Found candidate: ${result.firstName || ''} ${result.lastName || ''}`);

        return NextResponse.json({
            success: true,
            candidate: result
        });

    } catch (error) {
        console.error('❌ Error fetching candidate:', error);
        return NextResponse.json(
            { 
                error: 'Failed to fetch candidate',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
