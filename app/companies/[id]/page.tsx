'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Loader2, ArrowLeft, Globe, Briefcase } from 'lucide-react'
import { Company } from '@/lib/mock-data'

// ─── Types ────────────────────────────────────────────────────────────────────
interface JobRow {
    id: string
    $id: string
    title: string
    status: string
    city?: string
    state?: string
    address?: string
    min_salary?: number
    max_salary?: number
    currency?: string
    openings?: number
    company_name?: string
    // The column the user added directly in the dashboard will appear here too
    [key: string]: any
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function statusColor(status: string) {
    switch (status?.toLowerCase()) {
        case 'open': return 'default'
        case 'on_hold': return 'secondary'
        case 'closed': return 'outline'
        case 'cancelled': return 'destructive'
        default: return 'secondary'
    }
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function CompanyDetailPage() {
    const params = useParams()
    const router = useRouter()
    const id = params.id as string

    const [company, setCompany] = useState<Company | null>(null)
    const [jobs, setJobs] = useState<JobRow[]>([])
    const [loadingCompany, setLoadingCompany] = useState(true)
    const [loadingJobs, setLoadingJobs] = useState(true)
    const [notFound, setNotFound] = useState(false)

    // Edit state
    const [isEditing, setIsEditing] = useState(false)
    const [editData, setEditData] = useState<Partial<Company>>({})
    const [saving, setSaving] = useState(false)

    // ── Fetch company details ─────────────────────────────────────────────
    useEffect(() => {
        async function fetchCompany() {
            setLoadingCompany(true)
            try {
                const res = await fetch(`/api/companies/${id}`)
                if (res.status === 404) { setNotFound(true); return }
                if (!res.ok) throw new Error('Failed to load company')
                const data = await res.json()
                setCompany(data)
                setEditData(data)
            } catch (err) {
                console.error(err)
                setNotFound(true)
            } finally {
                setLoadingCompany(false)
            }
        }
        fetchCompany()
    }, [id])

    // ── Fetch jobs for this company (joined by company_id) ────────────────
    useEffect(() => {
        async function fetchJobs() {
            setLoadingJobs(true)
            try {
                const res = await fetch(`/api/jobs?company_id=${id}`)
                if (!res.ok) throw new Error('Failed to load jobs')
                setJobs(await res.json())
            } catch (err) {
                console.error(err)
            } finally {
                setLoadingJobs(false)
            }
        }
        fetchJobs()
    }, [id])

    // ─── Handlers ─────────────────────────────────────────────────────────
    const handleSave = async () => {
        setSaving(true)
        try {
            const res = await fetch(`/api/companies/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editData),
            })
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}))
                throw new Error(errData.fullError || errData.details || errData.error || 'Failed to update company')
            }
            
            const updated = await res.json()
            // We expect the updated row to come back, but let's re-fetch to be safe and get the normalized shape
            const refreshRes = await fetch(`/api/companies/${id}`)
            const refreshedData = await refreshRes.json()
            
            setCompany(refreshedData)
            setEditData(refreshedData)
            setIsEditing(false)
        } catch (err: any) {
            console.error(err)
            alert(err.message || 'Failed to save changes')
        } finally {
            setSaving(false)
        }
    }

    const handleCancel = () => {
        setEditData(company || {})
        setIsEditing(false)
    }

    // ─── Job summary counts (computed from live data) ─────────────────────
    const jobCounts = {
        open: jobs.filter(j => j.status?.toLowerCase() === 'open').length,
        on_hold: jobs.filter(j => j.status?.toLowerCase() === 'on_hold').length,
        closed: jobs.filter(j => j.status?.toLowerCase() === 'closed').length,
        cancelled: jobs.filter(j => j.status?.toLowerCase() === 'cancelled').length,
    }

    // ─── Loading / Not found states ───────────────────────────────────────
    if (loadingCompany) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (notFound || !company) {
        return (
            <div className="p-8 space-y-4">
                <p className="text-muted-foreground">Company not found.</p>
                <Button variant="outline" onClick={() => router.push('/companies')}>
                    <ArrowLeft className="h-4 w-4 mr-2" /> Back to Companies
                </Button>
            </div>
        )
    }

    return (
        <div className="p-8 space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" onClick={() => router.push('/companies')} disabled={isEditing}>
                        <ArrowLeft className="h-4 w-4 mr-1" /> Companies
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold">{company.name}</h1>
                        <p className="text-muted-foreground">{company.industry}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    {isEditing ? (
                        <>
                            <Button variant="outline" onClick={handleCancel} disabled={saving}>Cancel</Button>
                            <Button onClick={handleSave} disabled={saving}>
                                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                Save Changes
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button variant="outline" onClick={() => setIsEditing(true)}>Edit</Button>
                            <Button variant="destructive">Delete</Button>
                        </>
                    )}
                </div>
            </div>

            <Tabs defaultValue="details" className="w-full">
                <TabsList className="w-full justify-start h-auto flex-wrap">
                    <TabsTrigger value="details">Company Details</TabsTrigger>
                    <TabsTrigger value="jobs">
                        Jobs
                        {jobs.length > 0 && (
                            <Badge variant="secondary" className="ml-2">{jobs.length}</Badge>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="contacts">Contacts</TabsTrigger>
                </TabsList>

                {/* ── Company Details tab ─────────────────────────────────── */}
                <TabsContent value="details" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Company Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Name</Label>
                                    <Input 
                                        value={isEditing ? editData.name : company.name} 
                                        onChange={e => setEditData({ ...editData, name: e.target.value })}
                                        readOnly={!isEditing} 
                                        className={!isEditing ? "bg-muted/50" : ""}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Industry</Label>
                                    <Input 
                                        value={isEditing ? editData.industry : company.industry} 
                                        onChange={e => setEditData({ ...editData, industry: e.target.value })}
                                        readOnly={!isEditing} 
                                        className={!isEditing ? "bg-muted/50" : ""}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Website</Label>
                                    <div className="flex items-center gap-2">
                                        <Input 
                                            value={isEditing ? editData.website : company.website} 
                                            onChange={e => setEditData({ ...editData, website: e.target.value })}
                                            readOnly={!isEditing} 
                                            className={!isEditing ? "bg-muted/50" : ""}
                                        />
                                        {!isEditing && company.website && (
                                            <a
                                                href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 hover:underline shrink-0"
                                            >
                                                <Globe className="h-4 w-4" />
                                            </a>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Owner ID</Label>
                                    <Input 
                                        value={isEditing ? editData.owner : company.owner} 
                                        onChange={e => setEditData({ ...editData, owner: e.target.value })}
                                        readOnly={!isEditing} 
                                        className={!isEditing ? "bg-muted/50" : ""}
                                    />
                                </div>
                            </div>

                            {/* Address breakdown */}
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label>Address</Label>
                                    <Input 
                                        value={isEditing ? (editData as any).address ?? '' : (company as any).address ?? ''} 
                                        onChange={e => setEditData({ ...editData, address: e.target.value })}
                                        readOnly={!isEditing} 
                                        className={!isEditing ? "bg-muted/50" : ""}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>City</Label>
                                    <Input 
                                        value={isEditing ? (editData as any).city ?? '' : (company as any).city ?? ''} 
                                        onChange={e => setEditData({ ...editData, city: e.target.value })}
                                        readOnly={!isEditing} 
                                        className={!isEditing ? "bg-muted/50" : ""}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>State</Label>
                                    <Input 
                                        value={isEditing ? (editData as any).state ?? '' : (company as any).state ?? ''} 
                                        onChange={e => setEditData({ ...editData, state: e.target.value })}
                                        readOnly={!isEditing} 
                                        className={!isEditing ? "bg-muted/50" : ""}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Country</Label>
                                    <Input 
                                        value={isEditing ? (editData as any).country ?? '' : (company as any).country ?? ''} 
                                        onChange={e => setEditData({ ...editData, country: e.target.value })}
                                        readOnly={!isEditing} 
                                        className={!isEditing ? "bg-muted/50" : ""}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-2 text-sm">
                                <span className="text-muted-foreground">Hotlist:</span>
                                {isEditing ? (
                                    <select 
                                        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background max-w-[120px]"
                                        value={editData.hotlist ? 'yes' : 'no'}
                                        onChange={e => setEditData({ ...editData, hotlist: e.target.value === 'yes' })}
                                    >
                                        <option value="yes">Yes</option>
                                        <option value="no">No</option>
                                    </select>
                                ) : (
                                    <Badge variant={company.hotlist ? 'default' : 'outline'}>
                                        {company.hotlist ? 'Yes' : 'No'}
                                    </Badge>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ── Jobs tab ────────────────────────────────────────────── */}
                <TabsContent value="jobs" className="mt-6 space-y-4">
                    {/* Summary counts */}
                    <div className="grid grid-cols-4 gap-4 text-center">
                        {[
                            { label: 'Open', count: jobCounts.open, variant: 'default' },
                            { label: 'On Hold', count: jobCounts.on_hold, variant: 'secondary' },
                            { label: 'Closed', count: jobCounts.closed, variant: 'outline' },
                            { label: 'Cancelled', count: jobCounts.cancelled, variant: 'destructive' },
                        ].map(({ label, count, variant }) => (
                            <Card key={label}>
                                <CardContent className="pt-4">
                                    <div className="text-2xl font-bold">{count}</div>
                                    <div className="text-sm text-muted-foreground">{label}</div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Jobs table */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <Briefcase className="h-4 w-4" /> Jobs at {company.name}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {loadingJobs ? (
                                <div className="flex items-center justify-center h-24 gap-2 text-muted-foreground">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Loading jobs…
                                </div>
                            ) : jobs.length === 0 ? (
                                <p className="text-muted-foreground text-sm text-center py-8">
                                    No jobs linked to this company yet.
                                </p>
                            ) : (
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Job Title</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Location</TableHead>
                                                <TableHead>Salary Range</TableHead>
                                                <TableHead>Openings</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {jobs.map((job) => (
                                                <TableRow
                                                    key={job.$id || job.id}
                                                    className="cursor-pointer hover:bg-muted/50"
                                                    onClick={() => router.push(`/jobs/${job.$id || job.id}`)}
                                                >
                                                    <TableCell className="font-medium">{job.title}</TableCell>
                                                    <TableCell>
                                                        <Badge variant={statusColor(job.status) as any}>
                                                            {job.status?.replace('_', ' ') ?? '—'}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        {[job.city, job.state].filter(Boolean).join(', ') || '—'}
                                                    </TableCell>
                                                    <TableCell>
                                                        {job.min_salary && job.max_salary
                                                            ? `${job.currency ?? ''} ${job.min_salary.toLocaleString()} – ${job.max_salary.toLocaleString()}`
                                                            : '—'}
                                                    </TableCell>
                                                    <TableCell>{job.openings ?? '—'}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ── Contacts tab ─────────────────────────────────────────── */}
                <TabsContent value="contacts" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Contacts</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground text-sm">
                                Contacts at this company will appear here.
                            </p>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
