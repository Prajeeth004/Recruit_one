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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    MoreHorizontal,
    Search,
    Plus,
    Filter,
    Download,
    Phone,
    Mail,
    FileText,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react'
import { CreateCandidateDialog } from '@/features/candidates/components/create-candidate-dialog'
import { getResumeUrl, deleteCandidate } from '@/lib/clientDbService'
import { toast } from 'sonner'

const PAGE_SIZE = 10

export default function CandidatesPage() {
    const router = useRouter()
    const [candidates, setCandidates] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const [openDialog, setOpenDialog] = useState(false)
    const [currentPage, setCurrentPage] = useState(1)

    useEffect(() => {
        const fetchCandidates = async () => {
            setIsLoading(true)
            try {
                const { getCandidates } = await import('@/lib/clientDbService')
                const data = await getCandidates()
                setCandidates(data)
            } catch (error) {
                console.error('Failed to fetch candidates:', error)
            } finally {
                setIsLoading(false)
            }
        }
        fetchCandidates()
    }, [])

    // Reset to page 1 whenever the search query changes
    useEffect(() => {
        setCurrentPage(1)
    }, [searchQuery])

    const filteredCandidates = candidates.filter((candidate) => {
        const fullName =
            candidate.name ||
            `${candidate.firstName || ''} ${candidate.lastName || ''}`.trim()
        const email = candidate.email || ''
        return (
            fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            email.toLowerCase().includes(searchQuery.toLowerCase())
        )
    })

    // Pagination
    const totalPages = Math.max(1, Math.ceil(filteredCandidates.length / PAGE_SIZE))
    const safePage = Math.min(currentPage, totalPages)
    const startIndex = (safePage - 1) * PAGE_SIZE
    const pagedCandidates = filteredCandidates.slice(startIndex, startIndex + PAGE_SIZE)

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedIds(new Set(pagedCandidates.map((c) => c.$id)))
        } else {
            setSelectedIds(new Set())
        }
    }

    const handleSelectRow = (id: string, checked: boolean) => {
        const next = new Set(selectedIds)
        if (checked) next.add(id)
        else next.delete(id)
        setSelectedIds(next)
    }

    const handleViewResume = async (resumeFileId: string) => {
        try {
            const resumeUrl = await getResumeUrl(resumeFileId)
            window.open(resumeUrl, '_blank')
        } catch (error) {
            console.error('Error viewing resume:', error)
            toast.error('Failed to view resume')
        }
    }

    const handleDelete = async (id: string, name: string) => {
        if (!window.confirm(`Are you sure you want to delete ${name}?`)) return
        try {
            await deleteCandidate(id)
            toast.success('Candidate deleted successfully')
            setCandidates((prev) => prev.filter((c) => c.$id !== id))
            setSelectedIds((prev) => {
                const next = new Set(prev)
                next.delete(id)
                return next
            })
        } catch (error) {
            console.error('Failed to delete candidate:', error)
            toast.error('Failed to delete candidate')
        }
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Candidates</h1>
                    <p className="text-muted-foreground">Manage and track your candidate pipeline.</p>
                </div>
                <Button onClick={() => setOpenDialog(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Candidate
                </Button>
            </div>

            <Card>
                <CardHeader className="pb-3">
                    <CardTitle>All Candidates</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {/* Toolbar */}
                        <div className="flex items-center justify-between gap-4">
                            <div className="relative flex-1 max-w-sm">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search candidates..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-8"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                {selectedIds.size > 0 && (
                                    <>
                                        <Button variant="outline" size="sm" className="gap-2">
                                            <Phone className="h-4 w-4" />
                                            Call ({selectedIds.size})
                                        </Button>
                                        <Button variant="outline" size="sm" className="gap-2">
                                            <Mail className="h-4 w-4" />
                                            Email ({selectedIds.size})
                                        </Button>
                                    </>
                                )}
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

                        {/* Table */}
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-12">
                                            <Checkbox
                                                checked={
                                                    pagedCandidates.length > 0 &&
                                                    pagedCandidates.every((c) => selectedIds.has(c.$id))
                                                }
                                                onCheckedChange={(checked) =>
                                                    handleSelectAll(checked as boolean)
                                                }
                                            />
                                        </TableHead>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Phone</TableHead>
                                        <TableHead>Location</TableHead>
                                        <TableHead>Current Role</TableHead>
                                        <TableHead>Call Log</TableHead>
                                        <TableHead>Response</TableHead>
                                        <TableHead className="w-12" />
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={9} className="h-24 text-center">
                                                Loading candidates...
                                            </TableCell>
                                        </TableRow>
                                    ) : pagedCandidates.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={9} className="h-24 text-center">
                                                No candidates found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        pagedCandidates.map((candidate) => {
                                            const candidateId = candidate.$id
                                            return (
                                                <TableRow
                                                    key={candidateId}
                                                    className="cursor-pointer hover:bg-muted/50"
                                                    onClick={() => router.push(`/candidates/${candidateId}`)}
                                                >
                                                    <TableCell onClick={(e) => e.stopPropagation()}>
                                                        <Checkbox
                                                            checked={selectedIds.has(candidateId)}
                                                            onCheckedChange={(checked) =>
                                                                handleSelectRow(candidateId, checked as boolean)
                                                            }
                                                        />
                                                    </TableCell>
                                                    <TableCell className="font-medium">
                                                        {candidate.firstName} {candidate.lastName}
                                                    </TableCell>
                                                    <TableCell>{candidate.email}</TableCell>
                                                    <TableCell>{candidate.phone || '-'}</TableCell>
                                                    <TableCell>
                                                        {candidate.city
                                                            ? `${candidate.city}, ${candidate.state || ''}`
                                                            : '-'}
                                                    </TableCell>
                                                    <TableCell
                                                        className="max-w-[200px] truncate"
                                                        title={candidate.title || ''}
                                                    >
                                                        {candidate.title ||
                                                            (candidate.current_organization
                                                                ? candidate.current_organization
                                                                : '-')}
                                                    </TableCell>
                                                    <TableCell>
                                                        {candidate.callLog?.length > 0 ? (
                                                            <span className="text-xs text-muted-foreground">
                                                                {candidate.callLog[candidate.callLog.length - 1]}
                                                            </span>
                                                        ) : (
                                                            <span className="text-xs text-muted-foreground">-</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        {candidate.candidateResponse ? (
                                                            <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-secondary text-secondary-foreground">
                                                                {candidate.candidateResponse}
                                                            </span>
                                                        ) : (
                                                            <span className="text-xs text-muted-foreground">-</span>
                                                        )}
                                                    </TableCell>
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
                                                                {candidate.resume_file_id && (
                                                                    <DropdownMenuItem
                                                                        onClick={(e) => {
                                                                            e.stopPropagation()
                                                                            handleViewResume(candidate.resume_file_id)
                                                                        }}
                                                                    >
                                                                        <FileText className="mr-2 h-4 w-4" />
                                                                        View Resume
                                                                    </DropdownMenuItem>
                                                                )}
                                                                <DropdownMenuItem
                                                                    onClick={() =>
                                                                        router.push(`/candidates/${candidateId}`)
                                                                    }
                                                                >
                                                                    View Profile
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem>
                                                                    <Phone className="mr-2 h-4 w-4" />
                                                                    Call Candidate
                                                                </DropdownMenuItem>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem
                                                                    className="text-destructive"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation()
                                                                        handleDelete(
                                                                            candidateId,
                                                                            `${candidate.firstName} ${candidate.lastName}`
                                                                        )
                                                                    }}
                                                                >
                                                                    Delete Candidate
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </TableCell>
                                                </TableRow>
                                            )
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination Controls */}
                        {!isLoading && filteredCandidates.length > 0 && (
                            <div className="flex items-center justify-between pt-2">
                                <p className="text-sm text-muted-foreground">
                                    Showing {startIndex + 1}–
                                    {Math.min(startIndex + PAGE_SIZE, filteredCandidates.length)} of{' '}
                                    {filteredCandidates.length} candidates
                                </p>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="gap-1"
                                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                        disabled={safePage <= 1}
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                        Previous
                                    </Button>
                                    <span className="text-sm font-medium px-2">
                                        Page {safePage} of {totalPages}
                                    </span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="gap-1"
                                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                        disabled={safePage >= totalPages}
                                    >
                                        Next
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            <CreateCandidateDialog
                open={openDialog}
                onOpenChange={setOpenDialog}
                onCandidateCreate={(newCandidate) => {
                    setCandidates((prev) => [newCandidate, ...prev])
                    setOpenDialog(false)
                }}
            />
        </div>
    )
}
