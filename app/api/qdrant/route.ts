import { NextRequest, NextResponse } from 'next/server';
import { QdrantClient } from '@qdrant/js-client-rest';

// Initialize Qdrant Client (server-side only)
const qdrantClient = new QdrantClient({
    url: process.env.NEXT_PUBLIC_QDRANT_URL,
    apiKey: process.env.NEXT_PUBLIC_QDRANT_API_KEY,
});

export async function POST(request: NextRequest) {
    try {
        const { collectionName, id, vector, payload } = await request.json();

        console.log('Qdrant API route called with:', { collectionName, id, vectorLength: vector?.length, payload });

        if (!collectionName || !id || !vector) {
            return NextResponse.json(
                { error: 'Missing required fields: collectionName, id, vector' },
                { status: 400 }
            );
        }

        // Upload to Qdrant
        console.log('Attempting to upsert to Qdrant...');
        const result = await qdrantClient.upsert(collectionName, {
            points: [
                {
                    id: id,
                    vector: vector,
                    payload: payload || {}
                }
            ]
        });

        console.log('Qdrant upsert successful:', result);

        return NextResponse.json({ success: true, result });
    } catch (error: any) {
        console.error('Error uploading to Qdrant - Full error:', error);
        console.error('Error message:', error.message);
        console.error('Error status:', error.status);
        console.error('Error data:', JSON.stringify(error.data, null, 2));
        console.error('Error stack:', error.stack);

        return NextResponse.json(
            {
                error: error.message || 'Failed to upload to Qdrant',
                details: error.data || null,
                status: error.status
            },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const url = new URL(request.url);
        const collectionName = url.searchParams.get('collectionName');
        const entityProperty = url.searchParams.get('entityProperty');
        const entityId = url.searchParams.get('entityId');

        console.log('Qdrant API DELETE route called with:', { collectionName, entityProperty, entityId });

        if (!collectionName || !entityProperty || !entityId) {
            return NextResponse.json(
                { error: 'Missing required fields: collectionName, entityProperty, entityId' },
                { status: 400 }
            );
        }

        // Delete from Qdrant using filter
        console.log('Attempting to delete from Qdrant...');
        const result = await qdrantClient.delete(collectionName, {
            filter: {
                must: [
                    {
                        key: entityProperty,
                        match: {
                            value: entityId
                        }
                    }
                ]
            }
        });

        console.log('Qdrant delete successful:', result);

        return NextResponse.json({ success: true, result });
    } catch (error: any) {
        console.error('Error deleting from Qdrant - Full error:', error);
        console.error('Error message:', error.message);

        return NextResponse.json(
            {
                error: error.message || 'Failed to delete from Qdrant',
                status: error.status
            },
            { status: 500 }
        );
    }
}
