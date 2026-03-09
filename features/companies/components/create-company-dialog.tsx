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
import { Loader2 } from 'lucide-react'

interface CreateCompanyDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onCompanyCreate: (company: any) => void
}

const emptyForm = {
    name: '',
    industry: '',
    address: '',
    city: '',
    state: '',
    country: '',
    website: '',
    owner_id: '',
    hotlist: false,
}

export function CreateCompanyDialog({
    open,
    onOpenChange,
    onCompanyCreate,
}: CreateCompanyDialogProps) {
    const [formData, setFormData] = useState(emptyForm)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)
        setError(null)

        try {
            const res = await fetch('/api/companies', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            })

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}))
                throw new Error(errData.fullError || errData.details || errData.error || 'Failed to create company')
            }

            const savedCompany = await res.json()
            onCompanyCreate(savedCompany)
            setFormData(emptyForm)
        } catch (err: any) {
            setError(err.message ?? 'Something went wrong')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Add Company</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    {/* Row 1: Name + Industry */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Company Name *</Label>
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
                            />
                        </div>
                    </div>

                    {/* Street address */}
                    <div className="space-y-2">
                        <Label htmlFor="address">Street Address</Label>
                        <Input
                            id="address"
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        />
                    </div>

                    {/* City / State / Country */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="city">City</Label>
                            <Input
                                id="city"
                                value={formData.city}
                                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="state">State</Label>
                            <Input
                                id="state"
                                value={formData.state}
                                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="country">Country</Label>
                            <Input
                                id="country"
                                value={formData.country}
                                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Website + Owner */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="website">Website</Label>
                            <Input
                                id="website"
                                placeholder="https://example.com"
                                value={formData.website}
                                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="owner_id">Owner ID</Label>
                            <Input
                                id="owner_id"
                                placeholder="User ID"
                                value={formData.owner_id}
                                onChange={(e) => setFormData({ ...formData, owner_id: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Hotlist */}
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="hotlist"
                            checked={formData.hotlist}
                            onCheckedChange={(checked) =>
                                setFormData({ ...formData, hotlist: checked as boolean })
                            }
                        />
                        <Label htmlFor="hotlist">Hotlist</Label>
                    </div>

                    {error && (
                        <p className="text-sm text-destructive">{error}</p>
                    )}

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={submitting}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={submitting} className="gap-2">
                            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                            {submitting ? 'Saving…' : 'Add Company'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
