'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MoreHorizontal, ArrowUpDown, Search, Plus, Filter, Download, Trash2 } from 'lucide-react'
import { CreateJobDialog } from '@/features/jobs/components/create-job-dialog'
import { deleteJob } from '@/lib/clientDbService'
import { toast } from 'sonner'

export default function JobsPage() {
    const router = useRouter()
    const [jobs, setJobs] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const [openDialog, setOpenDialog] = useState(false)
    const [editingJob, setEditingJob] = useState<any>(null)

    useEffect(() => {
        const fetchJobs = async () => {
            setIsLoading(true)
            try {
                const res = await fetch('/api/jobs')
                if (!res.ok) throw new Error('Failed to fetch jobs')
                const data = await res.json()
                setJobs(data)
            } catch (error) {
                console.error("Failed to fetch jobs:", error)
            } finally {
                setIsLoading(false)
            }
        }
        fetchJobs()
    }, [])

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedIds(new Set(jobs.map((j) => j.$id)))
        } else {
            setSelectedIds(new Set())
        }
    }

    const handleDelete = async (id: string, title: string) => {
        if (!window.confirm(`Are you sure you want to delete the job '${title}'?`)) return;
        try {
            await deleteJob(id);
            toast.success("Job deleted successfully");
            setJobs(jobs.filter(j => j.$id !== id));
            const newSelected = new Set(selectedIds);
            newSelected.delete(id);
            setSelectedIds(newSelected);
        } catch (error) {
            console.error("Failed to delete job:", error);
            toast.error("Failed to delete job");
        }
    }


    const handleSelectRow = (id: string, checked: boolean) => {
        const newSelected = new Set(selectedIds)
        if (checked) {
            newSelected.add(id)
        } else {
            newSelected.delete(id)
        }
        setSelectedIds(newSelected)
    }

    const filteredJobs = jobs.filter((job) =>
        (job.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (job.company || '').toLowerCase().includes(searchQuery.toLowerCase())
    )

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Open': return 'bg-green-100 text-green-700'
            case 'Closed': return 'bg-gray-100 text-gray-700'
            case 'Interviewing': return 'bg-blue-100 text-blue-700'
            case 'On Hold': return 'bg-yellow-100 text-yellow-700'
            default: return 'bg-gray-100 text-gray-700'
        }
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Jobs</h1>
                    <p className="text-muted-foreground">Manage your job postings and hiring pipelines.</p>
                </div>
                <Button onClick={() => setOpenDialog(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Create Job
                </Button>
            </div>

            <Card>
                <CardHeader className="pb-3">
                    <CardTitle>All Jobs</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between gap-4">
                            <div className="relative flex-1 max-w-sm">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search jobs..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-8"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm" className="gap-2">
                                    <Filter className="h-4 w-4" />
                                    Filter
                                </Button>
                                <Button variant="outline" size="sm" className="gap-2">
                                    <Download className="h-4 w-4" />
                                    Export
                                </Button>
                            </div>
                        </div>

                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[50px]">
                                            <Checkbox
                                                checked={selectedIds.size === jobs.length && jobs.length > 0}
                                                onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                                            />
                                        </TableHead>
                                        <TableHead>Title</TableHead>
                                        <TableHead>Company</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Keywords</TableHead>
                                        <TableHead>Location</TableHead>
                                        <TableHead>Posted Date</TableHead>
                                        <TableHead className="w-[50px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={8} className="h-24 text-center">
                                                Loading jobs...
                                            </TableCell>
                                        </TableRow>
                                    ) : filteredJobs.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={8} className="h-24 text-center">
                                                No jobs found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredJobs.map((job) => (
                                            <TableRow key={job.$id} className="cursor-pointer hover:bg-muted/50" onClick={() => router.push(`/jobs/${job.$id}`)}>
                                                <TableCell onClick={(e) => e.stopPropagation()}>
                                                    <Checkbox
                                                        checked={selectedIds.has(job.$id)}
                                                        onCheckedChange={(checked) => handleSelectRow(job.$id, checked as boolean)}
                                                    />
                                                </TableCell>
                                                <TableCell className="font-medium">{job.title}</TableCell>
                                                <TableCell>{job.company || job.company_name || '-'}</TableCell>
                                                <TableCell>
                                                    <Badge variant="secondary" className={getStatusColor(job.status)}>
                                                        {job.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="max-w-[200px] truncate" title={Array.isArray(job.skills) ? job.skills.join(', ') : job.skills}>
                                                    {Array.isArray(job.skills) ? job.skills.join(', ') : job.skills}
                                                </TableCell>
                                                <TableCell>{job.city ? `${job.city}, ${job.state || ''}` : '-'}</TableCell>
                                                <TableCell>{new Date(job.$createdAt).toLocaleDateString()}</TableCell>
                                                <TableCell onClick={(e) => e.stopPropagation()}>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                                <span className="sr-only">Open menu</span>
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                            <DropdownMenuItem onClick={() => router.push(`/jobs/${job.$id}`)}>
                                                                View Details
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setEditingJob(job); }}>
                                                                Edit Job
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem className="text-destructive" onClick={(e) => { e.stopPropagation(); handleDelete(job.$id, job.title); }}>Delete Job</DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <CreateJobDialog
                open={openDialog || !!editingJob}
                onOpenChange={(open) => {
                    setOpenDialog(open)
                    if (!open) setEditingJob(null)
                }}
                onJobCreate={(job) => {
                    if (editingJob) {
                        setJobs(jobs.map(j => j.$id === job.$id ? job : j))
                    } else {
                        setJobs([job, ...jobs])
                    }
                    setOpenDialog(false)
                    setEditingJob(null)
                }}
                initialData={editingJob}
                isEditMode={!!editingJob}
            />
        </div>
    )
}
