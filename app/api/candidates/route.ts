import { NextRequest, NextResponse } from 'next/server';
import { addCandidate } from '../../../../server/dbService.js';
import path from 'path';
import fs from 'fs/promises';

export async function POST(request: NextRequest) {
    try {
        const contentType = request.headers.get('content-type') || '';

        if (contentType.includes('multipart/form-data')) {
            // Handle resume upload
            const formData = await request.formData();
            const file = formData.get('resume') as File;

            if (!file) {
                return NextResponse.json(
                    { error: 'No resume file provided' },
                    { status: 400 }
                );
            }

            // Validate file type
            const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
            if (!allowedTypes.includes(file.type)) {
                return NextResponse.json(
                    { error: 'Invalid file type. Only PDF, DOC, and DOCX are allowed.' },
                    { status: 400 }
                );
            }

            // Save file temporarily
            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);
            const tmpDir = path.join(process.cwd(), 'tmp');
            await fs.mkdir(tmpDir, { recursive: true });
            const tmpPath = path.join(tmpDir, `upload_${Date.now()}_${file.name}`);
            await fs.writeFile(tmpPath, buffer);

            try {
                // Import parser and parse the resume
                const { parsePdfToJson, candidateSchema } = await import('../../../../server/parser.js');
                const candidateData = await parsePdfToJson(tmpPath, candidateSchema);

                // Add candidate with resume file
                const result = await addCandidate(candidateData, tmpPath, null);

                // Clean up temporary file
                await fs.unlink(tmpPath);

                return NextResponse.json({
                    success: true,
                    candidate: result.candidate,
                    candidateId: result.candidateId,
                    resumeFileId: result.resumeFileId,
                    embeddingId: result.embeddingId,
                    message: 'Candidate created successfully from resume'
                });
            } catch (parseError) {
                // Clean up temporary file on error
                try {
                    await fs.unlink(tmpPath);
                } catch (unlinkError) {
                    console.error('Error cleaning up temp file:', unlinkError);
                }
                throw parseError;
            }
        } else {
            // Handle manual candidate creation
            const body = await request.json();

            // Map frontend form data to candidate schema
            const candidateData = {
                firstName: body.firstName || body.name?.split(' ')[0] || '',
                lastName: body.lastName || body.name?.split(' ').slice(1).join(' ') || '',
                email: body.email,
                phone: body.phone || null,
                gender: body.gender || null,
                dateOfBirth: body.dateOfBirth || null,
                city: body.city || null,
                state: body.state || null,
                country: body.country || null,
                postalCode: body.postalCode || null,
                fullAddress: body.fullAddress || null,
                skills: body.skills ? (Array.isArray(body.skills) ? body.skills : body.skills.split(',').map((s: string) => s.trim())) : [],
                summary: body.summary || null,
                workHistory: body.workHistory || [],
                education: body.education || [],
                employmentInfo: {
                    currentTitle: body.currentTitle || null,
                    currentOrganization: body.currentOrganization || null,
                    totalExperienceYears: body.totalExperience || 0,
                    relevantExperienceYears: body.relevantExperience || 0,
                    currentSalary: body.currentSalary || null,
                    salaryExpectation: body.expectedSalary || null,
                    currencyType: body.currency || 'INR',
                    currentEmploymentStatus: body.employmentStatus || null,
                    noticePeriodDays: body.noticePeriod || null,
                    availableFrom: body.availableFrom || null,
                },
                socialProfiles: {
                    linkedinUrl: body.linkedin || null,
                    githubUrl: body.github || null,
                    portfolioUrl: body.portfolio || null,
                },
                languageSkills: body.languages || [],
                willingToRelocate: body.willingToRelocate || false,
                source: 'manual',
            };

            // Add candidate without resume file
            const result = await addCandidate(candidateData, null, body.ownerId || null);

            return NextResponse.json({
                success: true,
                candidate: result.candidate,
                candidateId: result.candidateId,
                embeddingId: result.embeddingId,
                message: 'Candidate created successfully'
            });
        }
    } catch (error: any) {
        console.error('Error creating candidate:', error);
        return NextResponse.json(
            {
                error: 'Failed to create candidate',
                details: error.message
            },
            { status: 500 }
        );
    }
}
