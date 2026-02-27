'use client'

import { useState } from 'react'
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
import { MoreHorizontal, ArrowUpDown, Search, Plus, Filter, Download, Trash2, Globe } from 'lucide-react'
import { COMPANIES, Company } from '@/lib/mock-data'
import { CreateCompanyDialog } from '@/features/companies/components/create-company-dialog'

export default function CompaniesPage() {
    const router = useRouter()
    const [companies, setCompanies] = useState<Company[]>(COMPANIES)
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const [openDialog, setOpenDialog] = useState(false)

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

    const filteredCompanies = companies.filter((company) =>
        company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        company.industry.toLowerCase().includes(searchQuery.toLowerCase())
    )

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
                                    {filteredCompanies.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="h-24 text-center">
                                                No companies found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredCompanies.map((company) => (
                                            <TableRow key={company.id} className="cursor-pointer hover:bg-muted/50" onClick={() => router.push(`/companies/${company.id}`)}>
                                                <TableCell onClick={(e) => e.stopPropagation()}>
                                                    <Checkbox
                                                        checked={selectedIds.has(company.id)}
                                                        onCheckedChange={(checked) => handleSelectRow(company.id, checked as boolean)}
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
                                                    <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                                        <Globe className="h-3 w-3" />
                                                        Visit
                                                    </a>
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
                                                            <DropdownMenuItem onClick={() => router.push(`/companies/${company.id}`)}>
                                                                View Details
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem className="text-destructive">Delete Company</DropdownMenuItem>
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
                    setCompanies([...companies, newCompany])
                    setOpenDialog(false)
                }}
            />
        </div>
    )
}
