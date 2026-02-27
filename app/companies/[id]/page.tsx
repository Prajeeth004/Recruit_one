'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

import { COMPANIES } from '@/lib/mock-data'

export default function CompanyDetailPage() {
    const params = useParams()
    const id = params.id as string

    const [company, setCompany] = useState(COMPANIES.find(c => c.id === id) || COMPANIES[0])

    useEffect(() => {
        const found = COMPANIES.find(c => c.id === id)
        if (found) {
            setCompany(found)
        }
    }, [id])

    return (
        <div className="p-8 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">{company.name}</h1>
                    <p className="text-muted-foreground">{company.industry}</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline">Edit</Button>
                    <Button variant="destructive">Delete</Button>
                </div>
            </div>

            <Tabs defaultValue="details" className="w-full">
                <TabsList className="w-full justify-start h-auto flex-wrap">
                    <TabsTrigger value="details">Company Details</TabsTrigger>
                    <TabsTrigger value="jobs">Jobs</TabsTrigger>
                    <TabsTrigger value="contacts">Contacts</TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Company Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Name</Label>
                                    <Input defaultValue={company.name} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Industry</Label>
                                    <Input defaultValue={company.industry} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Website</Label>
                                    <Input defaultValue={company.website} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Owner</Label>
                                    <Input defaultValue={company.owner} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Full Address</Label>
                                <Textarea defaultValue={company.fullAddress} />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="jobs" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Jobs</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-4 gap-4 text-center">
                                <div className="p-4 border rounded-lg">
                                    <div className="text-2xl font-bold">{company.openJobs}</div>
                                    <div className="text-sm text-muted-foreground">Open</div>
                                </div>
                                <div className="p-4 border rounded-lg">
                                    <div className="text-2xl font-bold">{company.closedJobs}</div>
                                    <div className="text-sm text-muted-foreground">Closed</div>
                                </div>
                                <div className="p-4 border rounded-lg">
                                    <div className="text-2xl font-bold">{company.onHoldJobs}</div>
                                    <div className="text-sm text-muted-foreground">On Hold</div>
                                </div>
                                <div className="p-4 border rounded-lg">
                                    <div className="text-2xl font-bold">{company.cancelledJobs}</div>
                                    <div className="text-sm text-muted-foreground">Cancelled</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="contacts" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Contacts</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">List of contacts at this company.</p>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
