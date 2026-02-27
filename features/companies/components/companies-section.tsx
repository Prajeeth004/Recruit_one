'use client'

import { useState } from 'react'
import { Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'

interface Company {
    id: string
    name: string
    industry: string
    fullAddress: string
    website: string
    openJobs: number
    closedJobs: number
    onHoldJobs: number
    cancelledJobs: number
    owner: string
    hotlist: boolean
}

export function CompaniesSection() {
    const [companies, setCompanies] = useState<Company[]>([
        {
            id: '1',
            name: 'Acme Corp',
            industry: 'Technology',
            fullAddress: '123 Tech Blvd, San Francisco, CA',
            website: 'https://acme.com',
            openJobs: 5,
            closedJobs: 10,
            onHoldJobs: 2,
            cancelledJobs: 0,
            owner: 'John Doe',
            hotlist: true,
        },
        // Add more mock data as needed
    ])

    return (
        <div className="flex-1 p-8">
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-bold text-foreground">Companies</h2>
                <Button>
                    <Plus className="w-4 h-4" />
                    Add Company
                </Button>
            </div>

            <Card className="overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted hover:bg-muted">
                            <TableHead>Name</TableHead>
                            <TableHead>Industry</TableHead>
                            <TableHead>Full Address</TableHead>
                            <TableHead>Website</TableHead>
                            <TableHead>Open Jobs</TableHead>
                            <TableHead>Closed Jobs</TableHead>
                            <TableHead>On Hold Jobs</TableHead>
                            <TableHead>Cancelled Jobs</TableHead>
                            <TableHead>Owner</TableHead>
                            <TableHead>Hotlist</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {companies.map((company) => (
                            <TableRow key={company.id} className="hover:bg-muted/50">
                                <TableCell className="font-medium">{company.name}</TableCell>
                                <TableCell>{company.industry}</TableCell>
                                <TableCell>{company.fullAddress}</TableCell>
                                <TableCell>
                                    <a href={company.website} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                                        {company.website}
                                    </a>
                                </TableCell>
                                <TableCell>{company.openJobs}</TableCell>
                                <TableCell>{company.closedJobs}</TableCell>
                                <TableCell>{company.onHoldJobs}</TableCell>
                                <TableCell>{company.cancelledJobs}</TableCell>
                                <TableCell>{company.owner}</TableCell>
                                <TableCell>{company.hotlist ? 'Yes' : 'No'}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Card>
        </div>
    )
}
