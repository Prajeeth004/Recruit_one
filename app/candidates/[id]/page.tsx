'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { CandidateActions } from '@/features/candidates/components/candidate-actions'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { deleteCandidate } from '@/lib/clientDbService'
import { toast } from 'sonner'
import { CreateCandidateDialog } from '@/features/candidates/components/create-candidate-dialog'

export default function CandidateDetailPage() {
    const params = useParams()
    const router = useRouter()
    const id = params.id as string

    const [candidate, setCandidate] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

    useEffect(() => {
        const fetchCandidate = async () => {
            setIsLoading(true)
            try {
                const { getCandidate } = await import('@/lib/clientDbService')
                const data = await getCandidate(id)
                setCandidate(data)
            } catch (error) {
                console.error("Failed to fetch candidate:", error)
            } finally {
                setIsLoading(false)
            }
        }
        if (id) {
            fetchCandidate()
        }
    }, [id])

    const [questions, setQuestions] = useState<any[]>([])
    const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false)

    const handleGenerateQuestions = async () => {
        setIsGeneratingQuestions(true)
        try {
            const response = await fetch('/api/generate-questions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ candidateDetails: candidate }),
            })
            const data = await response.json()
            setQuestions(data.questions)
        } catch (error) {
            console.error('Error generating questions:', error)
        } finally {
            setIsGeneratingQuestions(false)
        }
    }

    const handleDelete = async () => {
        if (!window.confirm("Are you sure you want to delete this candidate?")) return;
        try {
            await deleteCandidate(id);
            toast.success("Candidate deleted successfully");
            router.push('/candidates');
        } catch (error) {
            console.error("Failed to delete candidate:", error);
            toast.error("Failed to delete candidate");
        }
    }

    if (isLoading) {
        return <div className="p-8">Loading candidate details...</div>
    }

    if (!candidate) {
        return <div className="p-8">Candidate not found.</div>
    }

    return (
        <div className="p-8 space-y-8">
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">{candidate.firstName} {candidate.lastName}</h1>
                        <p className="text-muted-foreground">{candidate.email}</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setIsEditDialogOpen(true)}>Edit</Button>
                        <Button variant="destructive" onClick={handleDelete}>Delete</Button>
                    </div>
                </div>

                <CandidateActions candidateId={id} />
            </div>

            <Tabs defaultValue="all-details" className="w-full">

                <TabsList className="w-full justify-start h-auto flex-wrap">
                    <TabsTrigger value="activities">Activities</TabsTrigger>
                    <TabsTrigger value="all-details">All Details</TabsTrigger>
                    <TabsTrigger value="assigned-jobs">Assigned Jobs</TabsTrigger>
                    <TabsTrigger value="related-emails">Related Emails</TabsTrigger>
                    <TabsTrigger value="candidate-history">Candidate History</TabsTrigger>
                    <TabsTrigger value="hotlists">Hotlists</TabsTrigger>
                    <TabsTrigger value="related-deals">Related Deals</TabsTrigger>
                    <TabsTrigger value="contact-pitched">Contact(s) Pitched</TabsTrigger>
                    <TabsTrigger value="candidate-questions">Candidate Questions</TabsTrigger>
                </TabsList>

                <TabsContent value="activities" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Activities</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">Activity log will appear here.</p>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="all-details" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Candidate Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Name</Label>
                                    <Input defaultValue={`${candidate.firstName} ${candidate.lastName}`} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Email</Label>
                                    <Input defaultValue={candidate.email} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Phone</Label>
                                    <Input defaultValue={candidate.phone || ''} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Gender</Label>
                                    <Input defaultValue={candidate.gender || ''} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Skills</Label>
                                    <Input defaultValue={Array.isArray(candidate.skills) ? candidate.skills.join(', ') : candidate.skills} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Owner</Label>
                                    <Input defaultValue={candidate.owner_id || ''} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Full Address</Label>
                                <Textarea defaultValue={candidate.address || ''} />
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label>City</Label>
                                    <Input defaultValue={candidate.city || ''} />
                                </div>
                                <div className="space-y-2">
                                    <Label>State</Label>
                                    <Input defaultValue={candidate.state || ''} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Country</Label>
                                    <Input defaultValue={candidate.country || ''} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="assigned-jobs" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Assigned Jobs</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">List of assigned jobs.</p>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="related-emails" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Related Emails</CardTitle>
                        </CardHeader>
                        <CardContent><p>Email history.</p></CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="candidate-history" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Candidate History</CardTitle>
                        </CardHeader>
                        <CardContent><p>History log.</p></CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="hotlists" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Hotlists</CardTitle>
                        </CardHeader>
                        <CardContent><p>Hotlists.</p></CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="related-deals" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Related Deals</CardTitle>
                        </CardHeader>
                        <CardContent><p>Deals.</p></CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="contact-pitched" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Contact(s) Pitched</CardTitle>
                        </CardHeader>
                        <CardContent><p>Contacts pitched.</p></CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="candidate-questions" className="mt-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Candidate Questions</CardTitle>
                            <Button onClick={handleGenerateQuestions} disabled={isGeneratingQuestions}>
                                {isGeneratingQuestions ? 'Generating...' : 'Generate Questions with AI'}
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {questions.length > 0 ? (
                                <div className="grid gap-4">
                                    {questions.map((q: any, index: number) => (
                                        <Card key={index}>
                                            <CardContent className="pt-6">
                                                <div className="flex items-start gap-4">
                                                    <span className={`px-2 py-1 rounded text-xs font-medium ${q.category === 'Technical'
                                                        ? 'bg-blue-100 text-blue-700'
                                                        : 'bg-purple-100 text-purple-700'
                                                        }`}>
                                                        {q.category}
                                                    </span>
                                                    <p className="font-medium text-sm">{q.question}</p>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-muted-foreground">Click the button to generate interview questions based on the candidate's profile.</p>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <CreateCandidateDialog
                open={isEditDialogOpen}
                onOpenChange={setIsEditDialogOpen}
                onCandidateCreate={(updatedCandidate) => {
                    setCandidate(updatedCandidate);
                    setIsEditDialogOpen(false);
                }}
                initialData={candidate}
                isEditMode={true}
            />
        </div>
    )
}
