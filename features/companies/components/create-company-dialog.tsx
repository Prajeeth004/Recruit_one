'use client'

import { useState } from 'react'
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
import { Checkbox } from '@/components/ui/checkbox'

interface CreateCompanyDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onCompanyCreate: (company: any) => void
}

export function CreateCompanyDialog({
    open,
    onOpenChange,
    onCompanyCreate,
}: CreateCompanyDialogProps) {
    const [formData, setFormData] = useState({
        name: '',
        industry: '',
        fullAddress: '',
        website: '',
        openJobs: 0,
        closedJobs: 0,
        onHoldJobs: 0,
        cancelledJobs: 0,
        owner: '',
        hotlist: false,
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        const newCompany = {
            id: Math.random().toString(36).substr(2, 9),
            ...formData,
        }
        onCompanyCreate(newCompany)
        setFormData({
            name: '',
            industry: '',
            fullAddress: '',
            website: '',
            openJobs: 0,
            closedJobs: 0,
            onHoldJobs: 0,
            cancelledJobs: 0,
            owner: '',
            hotlist: false,
        })
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Add Company</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="industry">Industry</Label>
                            <Input
                                id="industry"
                                value={formData.industry}
                                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="fullAddress">Full Address</Label>
                        <Input
                            id="fullAddress"
                            value={formData.fullAddress}
                            onChange={(e) => setFormData({ ...formData, fullAddress: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="website">Website</Label>
                            <Input
                                id="website"
                                value={formData.website}
                                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="owner">Owner</Label>
                            <Input
                                id="owner"
                                value={formData.owner}
                                onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="openJobs">Open Jobs</Label>
                            <Input
                                id="openJobs"
                                type="number"
                                value={formData.openJobs}
                                onChange={(e) => setFormData({ ...formData, openJobs: parseInt(e.target.value) || 0 })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="closedJobs">Closed Jobs</Label>
                            <Input
                                id="closedJobs"
                                type="number"
                                value={formData.closedJobs}
                                onChange={(e) => setFormData({ ...formData, closedJobs: parseInt(e.target.value) || 0 })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="onHoldJobs">On Hold Jobs</Label>
                            <Input
                                id="onHoldJobs"
                                type="number"
                                value={formData.onHoldJobs}
                                onChange={(e) => setFormData({ ...formData, onHoldJobs: parseInt(e.target.value) || 0 })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="cancelledJobs">Cancelled Jobs</Label>
                            <Input
                                id="cancelledJobs"
                                type="number"
                                value={formData.cancelledJobs}
                                onChange={(e) => setFormData({ ...formData, cancelledJobs: parseInt(e.target.value) || 0 })}
                            />
                        </div>
                    </div>

                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="hotlist"
                            checked={formData.hotlist}
                            onCheckedChange={(checked) => setFormData({ ...formData, hotlist: checked as boolean })}
                        />
                        <Label htmlFor="hotlist">Hotlist</Label>
                    </div>

                    <DialogFooter>
                        <Button type="submit">Add Company</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
