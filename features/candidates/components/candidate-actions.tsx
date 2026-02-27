'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Briefcase, Phone, StickyNote, CheckSquare, Calendar, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface CandidateActionsProps {
    candidateId: string
}

export function CandidateActions({ candidateId }: CandidateActionsProps) {
    const [activeDialog, setActiveDialog] = useState<string | null>(null)
    const [jobs, setJobs] = useState<any[]>([])
    const [isLoadingJobs, setIsLoadingJobs] = useState(false)
    const [isAssigning, setIsAssigning] = useState(false)

    const closeDialog = () => setActiveDialog(null)

    useEffect(() => {
        if (activeDialog === 'assign') {
            const fetchJobs = async () => {
                setIsLoadingJobs(true)
                try {
                    const { getJobs } = await import('@/lib/clientDbService')
                    const data = await getJobs()
                    setJobs(data)
                } catch (error) {
                    console.error("Failed to fetch jobs:", error)
                    toast.error("Failed to load jobs")
                } finally {
                    setIsLoadingJobs(false)
                }
            }
            fetchJobs()
        }
    }, [activeDialog])

    const handleAssignJob = async (e: React.FormEvent) => {
        e.preventDefault()
        const formData = new FormData(e.target as HTMLFormElement)
        const jobId = formData.get('jobId') as string

        if (!jobId) return

        setIsAssigning(true)
        try {
            const { assignCandidateToJob } = await import('@/lib/clientDbService')
            await assignCandidateToJob(candidateId, jobId)
            toast.success("Candidate assigned to job successfully")
            closeDialog()
        } catch (error) {
            console.error("Failed to assign candidate:", error)
            toast.error("Failed to assign candidate")
        } finally {
            setIsAssigning(false)
        }
    }

    const handleLogCall = (e: React.FormEvent) => {
        e.preventDefault()
        const formData = new FormData(e.target as HTMLFormElement)
        console.log('Log Call:', Object.fromEntries(formData))
        closeDialog()
    }

    const handleAddNote = (e: React.FormEvent) => {
        e.preventDefault()
        const formData = new FormData(e.target as HTMLFormElement)
        console.log('Add Note:', Object.fromEntries(formData))
        closeDialog()
    }

    const handleCreateTask = (e: React.FormEvent) => {
        e.preventDefault()
        const formData = new FormData(e.target as HTMLFormElement)
        console.log('Create Task:', Object.fromEntries(formData))
        closeDialog()
    }

    const handleScheduleMeeting = (e: React.FormEvent) => {
        e.preventDefault()
        const formData = new FormData(e.target as HTMLFormElement)
        console.log('Schedule Meeting:', Object.fromEntries(formData))
        closeDialog()
    }

    return (
        <>
            <div className="flex gap-2 flex-wrap">
                <Button className="gap-2" onClick={() => setActiveDialog('assign')}>
                    <Briefcase className="w-4 h-4" />
                    Assign to Job
                </Button>
                <Button variant="secondary" className="gap-2" onClick={() => setActiveDialog('call')}>
                    <Phone className="w-4 h-4" />
                    Log Call
                </Button>
                <Button variant="secondary" className="gap-2" onClick={() => setActiveDialog('note')}>
                    <StickyNote className="w-4 h-4" />
                    Add Note
                </Button>
                <Button variant="secondary" className="gap-2" onClick={() => setActiveDialog('task')}>
                    <CheckSquare className="w-4 h-4" />
                    Create Task
                </Button>
                <Button variant="secondary" className="gap-2" onClick={() => setActiveDialog('meeting')}>
                    <Calendar className="w-4 h-4" />
                    Schedule Meeting
                </Button>
            </div>

            {/* Assign to Job Dialog */}
            <Dialog open={activeDialog === 'assign'} onOpenChange={(open) => !open && closeDialog()}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Assign to Job</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAssignJob} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="jobId">Select Job</Label>
                            <Select name="jobId" required>
                                <SelectTrigger>
                                    <SelectValue placeholder={isLoadingJobs ? "Loading jobs..." : "Select a job..."} />
                                </SelectTrigger>
                                <SelectContent>
                                    {jobs.map((job) => (
                                        <SelectItem key={job.$id} value={job.$id}>
                                            {job.title} - {job.company || job.company_name || 'Unknown Company'}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <DialogFooter>
                            <Button type="submit" disabled={isAssigning || isLoadingJobs}>
                                {isAssigning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Assign
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Log Call Dialog */}
            <Dialog open={activeDialog === 'call'} onOpenChange={(open) => !open && closeDialog()}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Log Call</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleLogCall} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="outcome">Call Outcome</Label>
                            <Select name="outcome" required>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select outcome..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="connected">Connected</SelectItem>
                                    <SelectItem value="left-voicemail">Left Voicemail</SelectItem>
                                    <SelectItem value="no-answer">No Answer</SelectItem>
                                    <SelectItem value="wrong-number">Wrong Number</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="notes">Notes</Label>
                            <Textarea id="notes" name="notes" placeholder="Call details..." required />
                        </div>
                        <DialogFooter>
                            <Button type="submit">Log Call</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Add Note Dialog */}
            <Dialog open={activeDialog === 'note'} onOpenChange={(open) => !open && closeDialog()}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Note</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAddNote} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="note">Note</Label>
                            <Textarea id="note" name="note" placeholder="Enter note..." required />
                        </div>
                        <DialogFooter>
                            <Button type="submit">Save Note</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Create Task Dialog */}
            <Dialog open={activeDialog === 'task'} onOpenChange={(open) => !open && closeDialog()}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create Task</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreateTask} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">Task Title</Label>
                            <Input id="title" name="title" placeholder="Task title" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="dueDate">Due Date</Label>
                            <Input id="dueDate" name="dueDate" type="date" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="priority">Priority</Label>
                            <Select name="priority" defaultValue="medium">
                                <SelectTrigger>
                                    <SelectValue placeholder="Priority" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="low">Low</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="high">High</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <DialogFooter>
                            <Button type="submit">Create Task</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Schedule Meeting Dialog */}
            <Dialog open={activeDialog === 'meeting'} onOpenChange={(open) => !open && closeDialog()}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Schedule Meeting</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleScheduleMeeting} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="meetingTitle">Meeting Title</Label>
                            <Input id="meetingTitle" name="title" placeholder="Meeting title" required />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="date">Date</Label>
                                <Input id="date" name="date" type="date" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="time">Time</Label>
                                <Input id="time" name="time" type="time" required />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea id="description" name="description" placeholder="Meeting agenda..." />
                        </div>
                        <DialogFooter>
                            <Button type="submit">Schedule</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    )
}
