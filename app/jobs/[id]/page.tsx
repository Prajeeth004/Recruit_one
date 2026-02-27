'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { JobCandidatesTable } from '@/features/jobs/components/job-candidates-table'
import { deleteJob } from '@/lib/clientDbService'
import { toast } from 'sonner'
import { CreateJobDialog } from '@/features/jobs/components/create-job-dialog'

export default function JobDetailPage() {
    const params = useParams()
    const router = useRouter()
    const id = params.id as string

    const [job, setJob] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

    useEffect(() => {
        const fetchJob = async () => {
            setIsLoading(true)
            try {
                const { getJob } = await import('@/lib/clientDbService')
                const data = await getJob(id)
                setJob(data)
            } catch (error) {
                console.error("Failed to fetch job:", error)
            } finally {
                setIsLoading(false)
            }
        }
        if (id) {
            fetchJob()
        }
    }, [id])

    const handleDelete = async () => {
        if (!window.confirm("Are you sure you want to delete this job?")) return;
        try {
            await deleteJob(id);
            toast.success("Job deleted successfully");
            router.push('/jobs');
        } catch (error) {
            console.error("Failed to delete job:", error);
            toast.error("Failed to delete job");
        }
    }

    if (isLoading) {
        return <div className="p-8">Loading job details...</div>
    }

    if (!job) {
        return <div className="p-8">Job not found.</div>
    }

    return (
        <div className="p-8 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">{job.title}</h1>
                    <p className="text-muted-foreground">{job.company || job.company_name}</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setIsEditDialogOpen(true)}>Edit</Button>
                    <Button variant="destructive" onClick={handleDelete}>Delete</Button>
                </div>
            </div>

            <Tabs defaultValue="details" className="w-full">
                <TabsList className="w-full justify-start h-auto flex-wrap">
                    <TabsTrigger value="details">Job Details</TabsTrigger>
                    <TabsTrigger value="candidates">Candidates</TabsTrigger>
                    <TabsTrigger value="pipeline">Hiring Pipeline</TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Job Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Title</Label>
                                    <Input defaultValue={job.title} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Company</Label>
                                    <Input defaultValue={job.company || job.company_name} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Status</Label>
                                    <Input defaultValue={job.status} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Owner</Label>
                                    <Input defaultValue={job.owner_id} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Description</Label>
                                <Textarea defaultValue={job.description || job.jobDescription} className="min-h-[100px]" />
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label>Min Salary</Label>
                                    <Input defaultValue={job.min_salary || job.minSalary} type="number" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Max Salary</Label>
                                    <Input defaultValue={job.max_salary || job.maxSalary} type="number" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Openings</Label>
                                    <Input defaultValue={job.openings} type="number" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="candidates" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Candidates</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <JobCandidatesTable jobId={id} />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="pipeline" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Hiring Pipeline</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">Pipeline visualization.</p>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <CreateJobDialog
                open={isEditDialogOpen}
                onOpenChange={setIsEditDialogOpen}
                onJobCreate={(updatedJob) => {
                    setJob(updatedJob);
                    setIsEditDialogOpen(false);
                }}
                initialData={job}
                isEditMode={true}
            />
        </div>
    )
}
