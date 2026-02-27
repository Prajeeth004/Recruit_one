'use client'

import { useState, useEffect } from 'react'
import { createCandidate, updateCandidate } from '@/lib/clientDbService'
import { toast } from 'sonner'
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
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Upload, Loader2, FileText } from 'lucide-react'

interface CreateCandidateDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onCandidateCreate: (candidate: any) => void
    initialData?: any
    isEditMode?: boolean
}

export function CreateCandidateDialog({
    open,
    onOpenChange,
    onCandidateCreate,
    initialData,
    isEditMode = false
}: CreateCandidateDialogProps) {
    const [activeTab, setActiveTab] = useState('manual')
    const [isLoading, setIsLoading] = useState(false)
    const [resumeFile, setResumeFile] = useState<File | null>(null)
    const [error, setError] = useState<string | null>(null)

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        gender: '',
        phone: '',
        skills: '',
        fullAddress: '',
        city: '',
        state: '',
        country: '',
        postalCode: '',
        currentTitle: '',
        currentOrganization: '',
        totalExperience: 0,
        summary: '',
        hotlist: false,
        currentSalary: '',
        expectedSalary: '',
        noticePeriod: '',
    })

    useEffect(() => {
        if (open && isEditMode && initialData) {
            setFormData({
                firstName: initialData.firstName || '',
                lastName: initialData.lastName || '',
                email: initialData.email || '',
                gender: initialData.gender || '',
                phone: initialData.phone || '',
                skills: Array.isArray(initialData.skills) ? initialData.skills.join(', ') : (initialData.skills || ''),
                fullAddress: initialData.address || initialData.fullAddress || '',
                city: initialData.city || '',
                state: initialData.state || '',
                country: initialData.country || '',
                postalCode: initialData.postal_code || initialData.postalCode || '',
                currentTitle: initialData.title || initialData.employmentInfo?.currentTitle || '',
                currentOrganization: initialData.current_organization || initialData.employmentInfo?.currentOrganization || '',
                totalExperience: initialData.total_experience || initialData.employmentInfo?.totalExperienceYears || 0,
                summary: initialData.summary || '',
                hotlist: initialData.hotlist || false,
                currentSalary: initialData.current_salary || initialData.employmentInfo?.currentSalary || '',
                expectedSalary: initialData.expected_salary || initialData.employmentInfo?.salaryExpectation || '',
                noticePeriod: initialData.notice_period || initialData.employmentInfo?.noticePeriodDays || '',
            })
            setActiveTab('manual');
        } else if (open && !isEditMode) {
            resetForm();
        }
    }, [open, isEditMode, initialData])


    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            // Validate file type
            const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
            if (!allowedTypes.includes(file.type)) {
                setError('Invalid file type. Only PDF, DOC, and DOCX are allowed.')
                return
            }
            setResumeFile(file)
            setError(null)
        }
    }

    const handleResumeUpload = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!resumeFile) {
            setError('Please select a resume file')
            return
        }

        setIsLoading(true)
        setError(null)

        try {
            // Create Candidate (Parsing handled by service if data is null)
            const result = await createCandidate(null, resumeFile);

            onCandidateCreate(result)
            resetForm()
            onOpenChange(false)
            toast.success('Candidate created from resume successfully')
        } catch (err: any) {
            console.error('Error uploading resume:', err)
            setError(err.message || 'Failed to upload resume. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    const handleManualSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError(null)

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (formData.email && !emailRegex.test(formData.email.trim())) {
            setError('Please enter a valid email address')
            setIsLoading(false)
            return
        }

        try {
            const candidateData = {
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                phone: formData.phone,
                skills: formData.skills.split(',').map(s => s.trim()),
                city: formData.city,
                state: formData.state,
                country: formData.country,
                postalCode: formData.postalCode,
                fullAddress: formData.fullAddress,
                employmentInfo: {
                    currentTitle: formData.currentTitle,
                    currentOrganization: formData.currentOrganization,
                    totalExperienceYears: formData.totalExperience,
                    currentSalary: formData.currentSalary,
                    salaryExpectation: formData.expectedSalary,
                    noticePeriodDays: formData.noticePeriod,
                },
                source: isEditMode ? initialData?.source : 'manual'
            };

            let result;
            if (isEditMode && initialData) {
                result = await updateCandidate(initialData.$id, candidateData);
                toast.success('Candidate updated successfully')
            } else {
                result = await createCandidate(candidateData);
                toast.success('Candidate created successfully')
            }

            onCandidateCreate(result)
            if (!isEditMode) resetForm()
            onOpenChange(false)
        } catch (err: any) {
            console.error('Error creating candidate:', err)
            setError(err.message || 'Failed to create candidate. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    const resetForm = () => {
        setFormData({
            firstName: '',
            lastName: '',
            email: '',
            gender: '',
            phone: '',
            skills: '',
            fullAddress: '',
            city: '',
            state: '',
            country: '',
            postalCode: '',
            currentTitle: '',
            currentOrganization: '',
            totalExperience: 0,
            summary: '',
            hotlist: false,
            currentSalary: '',
            expectedSalary: '',
            noticePeriod: '',
        })
        setResumeFile(null)
        setError(null)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{isEditMode ? 'Edit Candidate' : 'Add Candidate'}</DialogTitle>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    {!isEditMode && (
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="manual">Manual Entry</TabsTrigger>
                            <TabsTrigger value="upload">Upload Resume</TabsTrigger>
                        </TabsList>
                    )}

                    <TabsContent value="manual" className="space-y-4">
                        <form onSubmit={handleManualSubmit} className="grid gap-4 py-4">
                            {error && (
                                <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md border border-red-200">
                                    {error}
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="firstName">First Name *</Label>
                                    <Input
                                        id="firstName"
                                        value={formData.firstName}
                                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="lastName">Last Name *</Label>
                                    <Input
                                        id="lastName"
                                        value={formData.lastName}
                                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email *</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone</Label>
                                    <Input
                                        id="phone"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="currentTitle">Current Title</Label>
                                    <Input
                                        id="currentTitle"
                                        value={formData.currentTitle}
                                        onChange={(e) => setFormData({ ...formData, currentTitle: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="currentOrganization">Current Organization</Label>
                                    <Input
                                        id="currentOrganization"
                                        value={formData.currentOrganization}
                                        onChange={(e) => setFormData({ ...formData, currentOrganization: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="skills">Skills (comma-separated)</Label>
                                <Input
                                    id="skills"
                                    value={formData.skills}
                                    onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                                    placeholder="React, Node.js, TypeScript"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="summary">Summary</Label>
                                <Textarea
                                    id="summary"
                                    value={formData.summary}
                                    onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                                    className="min-h-[80px]"
                                />
                            </div>

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

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="hotlist"
                                    checked={formData.hotlist}
                                    onCheckedChange={(checked) => setFormData({ ...formData, hotlist: checked as boolean })}
                                />
                                <Label htmlFor="hotlist">Add to Hotlist</Label>
                            </div>

                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={isLoading}>
                                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {isEditMode ? 'Save Changes' : 'Add Candidate'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </TabsContent>

                    <TabsContent value="upload" className="space-y-4">
                        <form onSubmit={handleResumeUpload} className="grid gap-4 py-4">
                            {error && (
                                <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md border border-red-200">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-4">
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
                                    <Input
                                        id="resume-upload"
                                        type="file"
                                        accept=".pdf,.doc,.docx"
                                        onChange={handleFileChange}
                                        className="hidden"
                                    />
                                    <label
                                        htmlFor="resume-upload"
                                        className="cursor-pointer flex flex-col items-center gap-3"
                                    >
                                        <div className="p-3 bg-primary/10 rounded-full">
                                            {resumeFile ? (
                                                <FileText className="h-8 w-8 text-primary" />
                                            ) : (
                                                <Upload className="h-8 w-8 text-primary" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">
                                                {resumeFile ? resumeFile.name : 'Click to upload resume'}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                PDF, DOC, or DOCX (Max 10MB)
                                            </p>
                                        </div>
                                    </label>
                                </div>

                                {resumeFile && (
                                    <div className="p-4 bg-blue-50 rounded-md border border-blue-200">
                                        <p className="text-sm text-blue-800">
                                            <strong>Ready to parse:</strong> {resumeFile.name} ({(resumeFile.size / 1024).toFixed(1)} KB)
                                        </p>
                                        <p className="text-xs text-blue-600 mt-1">
                                            AI will extract candidate information from the resume automatically.
                                        </p>
                                    </div>
                                )}
                            </div>

                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={isLoading || !resumeFile}>
                                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {isLoading ? 'Parsing Resume...' : 'Upload & Parse'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    )
}
