'use client'

import { useState, useEffect } from 'react'
import * as XLSX from 'xlsx'
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
import { MoreHorizontal, Search, Plus, Filter, Download, Trash2, Globe, Loader2 } from 'lucide-react'
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetFooter,
} from '@/components/ui/sheet'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Company } from '@/lib/mock-data'
import { CreateCompanyDialog } from '@/features/companies/components/create-company-dialog'

export default function CompaniesPage() {
    const router = useRouter()
    const [companies, setCompanies] = useState<Company[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const [openDialog, setOpenDialog] = useState(false)
    const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false)

    // Filter states
    const [filterIndustry, setFilterIndustry] = useState<string>('all')
    const [filterLocation, setFilterLocation] = useState<string>('all')
    const [filterAddress, setFilterAddress] = useState<string>('')
    const [filterCompanyName, setFilterCompanyName] = useState<string>('')
    const [filterOpenJobs, setFilterOpenJobs] = useState<string>('all')
    const [filterRegion, setFilterRegion] = useState<string>('all')

    // ── Fetch companies from the API on mount ──────────────────────────────
    useEffect(() => {
        fetchCompanies()
    }, [])

    async function fetchCompanies() {
        setLoading(true)
        try {
            const res = await fetch('/api/companies')
            if (!res.ok) throw new Error('Failed to load companies')
            const data: Company[] = await res.json()
            setCompanies(data)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    // ── Delete a company ───────────────────────────────────────────────────
    async function handleDelete(id: string) {
        // Optimistic update
        setCompanies((prev) => prev.filter((c) => c.id !== id))
        setSelectedIds((prev) => {
            const next = new Set(prev)
            next.delete(id)
            return next
        })
        try {
            const res = await fetch(`/api/companies/${id}`, { method: 'DELETE' })
            if (!res.ok) {
                // Rollback on failure
                fetchCompanies()
            }
        } catch {
            fetchCompanies()
        }
    }

    // ── Selection helpers ──────────────────────────────────────────────────
    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedIds(new Set(companies.map((c) => c.id)))
        } else {
            setSelectedIds(new Set())
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

    // ── Filter ─────────────────────────────────────────────────────────────
    const filteredCompanies = companies.filter((company) => {
        const matchesSearch = company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            company.industry.toLowerCase().includes(searchQuery.toLowerCase())
        
        const matchesIndustry = filterIndustry === 'all' || company.industry?.toLowerCase() === filterIndustry.toLowerCase()
        
        // Location matching now only considers Country (normalized)
        const country = company.fullAddress.split(',').map(p => p.trim()).filter(Boolean).pop() || ''
        const normalizedCountry = country.charAt(0).toUpperCase() + country.slice(1).toLowerCase()
        const matchesLocation = filterLocation === 'all' || normalizedCountry === filterLocation
        
        const matchesAddress = !filterAddress || company.fullAddress.toLowerCase().includes(filterAddress.toLowerCase())
        const matchesCompanyName = !filterCompanyName || company.name.toLowerCase().includes(filterCompanyName.toLowerCase())
        
        let matchesOpenJobs = true
        if (filterOpenJobs !== 'all') {
            const count = company.openJobs || 0
            if (filterOpenJobs === '0') matchesOpenJobs = count === 0
            if (filterOpenJobs === '1-5') matchesOpenJobs = count >= 1 && count <= 5
            if (filterOpenJobs === '6-10') matchesOpenJobs = count >= 6 && count <= 10
            if (filterOpenJobs === '10+') matchesOpenJobs = count > 10
        }

        const region = company.fullAddress.split(',').map(p => p.trim()).filter(Boolean).reverse()[1] || ''
        const matchesRegion = filterRegion === 'all' || region.toLowerCase() === filterRegion.toLowerCase()

        return matchesSearch && matchesIndustry && matchesLocation && matchesAddress && matchesCompanyName && matchesOpenJobs && matchesRegion
    })

    // Get unique values for filters
    const industries_options: string[] = Array.from(new Set(companies.map(c => c.industry?.trim()).filter(Boolean).map(s => s!.charAt(0).toUpperCase() + s!.slice(1).toLowerCase()) as string[]))
    
    // Updated Location parsing to show only country names
    const locations_options: string[] = Array.from(new Set(companies.map(c => {
        const parts = c.fullAddress.split(',').map(p => p.trim()).filter(Boolean)
        const country = parts.pop() || null
        return country ? country.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ') : null
    }).filter(Boolean) as string[]))

    const regions_options: string[] = Array.from(new Set(companies.map(c => {
        const parts = c.fullAddress.split(',').map(p => p.trim()).filter(Boolean)
        const region = parts.length >= 2 ? parts[parts.length - 2] : null
        return region ? region.charAt(0).toUpperCase() + region.slice(1).toLowerCase() : null
    }).filter(Boolean) as string[]))

    const resetFilters = () => {
        setFilterIndustry('all')
        setFilterLocation('all')
        setFilterAddress('')
        setFilterCompanyName('')
        setFilterOpenJobs('all')
        setFilterRegion('all')
        setSearchQuery('')
    }

    const handleExport = () => {
        const dataToExport = filteredCompanies.map(c => ({
            Name: c.name,
            Industry: c.industry,
            Location: c.fullAddress,
            'Open Jobs': c.openJobs,
            Website: c.website
        }))
        const worksheet = XLSX.utils.json_to_sheet(dataToExport)
        const workbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workbook, worksheet, "Companies")
        XLSX.writeFile(workbook, "companies_export.xlsx")
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Companies</h1>
                    <p className="text-muted-foreground">Manage your client companies and partners.</p>
                </div>
                <Button onClick={() => setOpenDialog(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Company
                </Button>
            </div>

            <Card>
                <CardHeader className="pb-3">
                    <CardTitle>All Companies</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between gap-4">
                            <div className="relative flex-1 max-w-sm">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search companies..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-8"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <Sheet open={isFilterSheetOpen} onOpenChange={setIsFilterSheetOpen}>
                                    <SheetTrigger asChild>
                                        <Button variant="outline" size="sm" className="gap-2">
                                            <Filter className="h-4 w-4" />
                                            Filter
                                            {(filterIndustry !== 'all' || filterLocation !== 'all' || filterAddress || filterCompanyName || filterOpenJobs !== 'all' || filterRegion !== 'all') && (
                                                <Badge variant="secondary" className="ml-1 px-1 h-4 min-w-4 justify-center">
                                                    !
                                                </Badge>
                                            )}
                                        </Button>
                                    </SheetTrigger>
                                    <SheetContent className="w-[400px] sm:w-[540px]">
                                        <SheetHeader>
                                            <SheetTitle>Filter Companies</SheetTitle>
                                        </SheetHeader>
                                        <div className="grid gap-6 py-6 px-6 overflow-y-auto max-h-[calc(100vh-200px)]">
                                            <div className="grid gap-2">
                                                <Label htmlFor="filter-company-name" className="text-sm font-medium">Company Name</Label>
                                                <Input
                                                    id="filter-company-name"
                                                    placeholder="Search company name..."
                                                    value={filterCompanyName}
                                                    onChange={(e) => setFilterCompanyName(e.target.value)}
                                                    className="h-9"
                                                />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label htmlFor="filter-address" className="text-sm font-medium">Address</Label>
                                                <Input
                                                    id="filter-address"
                                                    placeholder="Search address..."
                                                    value={filterAddress}
                                                    onChange={(e) => setFilterAddress(e.target.value)}
                                                    className="h-9"
                                                />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label className="text-sm font-medium">Industry</Label>
                                                <Select value={filterIndustry} onValueChange={setFilterIndustry}>
                                                    <SelectTrigger className="h-9">
                                                        <SelectValue placeholder="Select Industry" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="all">All Industries</SelectItem>
                                                        {industries_options.map(ind => (
                                                            <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="grid gap-2">
                                                <Label className="text-sm font-medium">Region (State/Province)</Label>
                                                <Select value={filterRegion} onValueChange={setFilterRegion}>
                                                    <SelectTrigger className="h-9">
                                                        <SelectValue placeholder="Select Region" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="all">All Regions</SelectItem>
                                                        {regions_options.map(reg => (
                                                            <SelectItem key={reg} value={reg}>{reg}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="grid gap-2">
                                                <Label className="text-sm font-medium">Location (Country)</Label>
                                                <Select value={filterLocation} onValueChange={setFilterLocation}>
                                                    <SelectTrigger className="h-9">
                                                        <SelectValue placeholder="Select Location" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="all">All Locations</SelectItem>
                                                        {locations_options.map(loc => (
                                                            <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="grid gap-2">
                                                <Label className="text-sm font-medium">Open Jobs</Label>
                                                <Select value={filterOpenJobs} onValueChange={setFilterOpenJobs}>
                                                    <SelectTrigger className="h-9">
                                                        <SelectValue placeholder="Select Range" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="all">Any Number</SelectItem>
                                                        <SelectItem value="0">No Open Jobs</SelectItem>
                                                        <SelectItem value="1-5">1 - 5 Jobs</SelectItem>
                                                        <SelectItem value="6-10">6 - 10 Jobs</SelectItem>
                                                        <SelectItem value="10+">10+ Jobs</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                        <SheetFooter className="flex-col sm:flex-row gap-2 pt-4">
                                            <Button variant="outline" onClick={resetFilters} className="w-full sm:w-auto">
                                                Reset Filters
                                            </Button>
                                            <Button onClick={() => setIsFilterSheetOpen(false)} className="w-full sm:w-auto">
                                                Apply Filters
                                            </Button>
                                        </SheetFooter>
                                    </SheetContent>
                                </Sheet>
                                <Button variant="outline" size="sm" className="gap-2" onClick={handleExport}>
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
                                                checked={selectedIds.size === companies.length && companies.length > 0}
                                                onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                                            />
                                        </TableHead>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Industry</TableHead>
                                        <TableHead>Location</TableHead>
                                        <TableHead>Open Jobs</TableHead>
                                        <TableHead>Website</TableHead>
                                        <TableHead className="w-[50px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="h-24 text-center">
                                                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                    Loading companies…
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : filteredCompanies.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="h-24 text-center">
                                                No companies found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredCompanies.map((company) => (
                                            <TableRow
                                                key={company.id}
                                                className="cursor-pointer hover:bg-muted/50"
                                                onClick={() => router.push(`/companies/${company.id}`)}
                                            >
                                                <TableCell onClick={(e) => e.stopPropagation()}>
                                                    <Checkbox
                                                        checked={selectedIds.has(company.id)}
                                                        onCheckedChange={(checked) =>
                                                            handleSelectRow(company.id, checked as boolean)
                                                        }
                                                    />
                                                </TableCell>
                                                <TableCell className="font-medium">{company.name}</TableCell>
                                                <TableCell>{company.industry}</TableCell>
                                                <TableCell>{company.fullAddress}</TableCell>
                                                <TableCell>
                                                    <Badge variant="secondary">
                                                        {company.openJobs} Open
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {company.website ? (
                                                        <a
                                                            href={company.website}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-blue-600 hover:underline flex items-center gap-1"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            <Globe className="h-3 w-3" />
                                                            Visit
                                                        </a>
                                                    ) : (
                                                        <span className="text-muted-foreground text-sm">—</span>
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
                                                            <DropdownMenuItem
                                                                onClick={() => router.push(`/companies/${company.id}`)}
                                                            >
                                                                View Details
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem
                                                                className="text-destructive"
                                                                onClick={() => handleDelete(company.id)}
                                                            >
                                                                <Trash2 className="h-4 w-4 mr-2" />
                                                                Delete Company
                                                            </DropdownMenuItem>
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

            <CreateCompanyDialog
                open={openDialog}
                onOpenChange={setOpenDialog}
                onCompanyCreate={(newCompany) => {
                    setCompanies((prev) => [newCompany, ...prev])
                    setOpenDialog(false)
                }}
            />
        </div>
    )
}
