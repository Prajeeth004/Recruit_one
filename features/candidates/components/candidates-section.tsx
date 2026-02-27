'use client'

import { useState } from 'react'
import { Plus, Mail, Send, Calendar, Trash2, FileText, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { getResumeUrl } from '@/lib/clientDbService'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface Candidate {
  id: string
  name: string // This will be "Name" in the table, but maybe we can map it to "Contact Name" or just "Name"
  email: string
  gender: string
  phone: string
  resume: string
  resume_file_id?: string
  profileUpdatedByCandidateOn: string
  profileRequestSentOn: string
  skills: string
  fullAddress: string
  city: string
  state: string
  country: string
  owner: string
  lastEmailSentOn: string
  lastCommunication: string
  lastLinkedInMessageSentOn: string
  postalCode: string
  workHistory: string
  educationHistory: string
  hotlist: boolean
}

export function CandidatesSection() {
  const [candidates, setCandidates] = useState<Candidate[]>([
    {
      id: '1',
      name: 'Alice Johnson',
      email: 'alice@example.com',
      gender: 'Female',
      phone: '123-456-7890',
      resume: 'link_to_resume',
      resume_file_id: 'sample_resume_id_123',
      profileUpdatedByCandidateOn: '2025-01-15',
      profileRequestSentOn: '2025-01-10',
      skills: 'React, TypeScript, Node.js',
      fullAddress: '123 Main St, San Francisco, CA',
      city: 'San Francisco',
      state: 'CA',
      country: 'USA',
      owner: 'Recruiter A',
      lastEmailSentOn: '2025-01-18',
      lastCommunication: 'Call on 2025-01-19',
      lastLinkedInMessageSentOn: '2025-01-05',
      postalCode: '94105',
      workHistory: 'Senior Dev at Tech Co',
      educationHistory: 'BS CS at University',
      hotlist: true,
    },
    // Add more mock data
  ])

  const handleDeleteCandidate = (id: string) => {
    setCandidates(candidates.filter((candidate) => candidate.id !== id))
  }

  const handleSendEmail = (candidateId: string, email: string) => {
    console.log(`[v0] Sending email to ${email} for candidate ${candidateId}`)
  }

  const handleSendOffer = (candidateId: string) => {
    console.log(`[v0] Sending offer to candidate ${candidateId}`)
  }

  const handleScheduleInterview = (candidateId: string) => {
    console.log(`[v0] Scheduling interview for candidate ${candidateId}`)
  }

  const handleViewResume = async (resumeFileId: string) => {
    try {
      const resumeUrl = await getResumeUrl(resumeFileId)
      window.open(resumeUrl, '_blank')
    } catch (error) {
      console.error('Error viewing resume:', error)
      // You could show a toast notification here
    }
  }

  return (
    <div className="flex-1 p-8">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold text-foreground">Candidates</h2>
        <Button>
          <Plus className="w-4 h-4" />
          Add Candidate
        </Button>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted hover:bg-muted">
                <TableHead className="min-w-[150px]">Name</TableHead>
                <TableHead className="min-w-[200px]">Email</TableHead>
                <TableHead>Gender</TableHead>
                <TableHead className="min-w-[120px]">Phone</TableHead>
                <TableHead>Resume</TableHead>
                <TableHead className="min-w-[150px]">Profile Updated</TableHead>
                <TableHead className="min-w-[150px]">Request Sent</TableHead>
                <TableHead className="min-w-[200px]">Skills</TableHead>
                <TableHead className="min-w-[200px]">Address</TableHead>
                <TableHead>City</TableHead>
                <TableHead>State</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead className="min-w-[150px]">Last Email</TableHead>
                <TableHead className="min-w-[150px]">Last Comm</TableHead>
                <TableHead className="min-w-[150px]">Last LinkedIn</TableHead>
                <TableHead>Postal Code</TableHead>
                <TableHead className="min-w-[200px]">Work History</TableHead>
                <TableHead className="min-w-[200px]">Education</TableHead>
                <TableHead>Hotlist</TableHead>
                <TableHead className="text-right sticky right-0 bg-background">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {candidates.map((candidate) => (
                <TableRow key={candidate.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">{candidate.name}</TableCell>
                  <TableCell>{candidate.email}</TableCell>
                  <TableCell>{candidate.gender}</TableCell>
                  <TableCell>{candidate.phone}</TableCell>
                  <TableCell>{candidate.resume}</TableCell>
                  <TableCell>{candidate.profileUpdatedByCandidateOn}</TableCell>
                  <TableCell>{candidate.profileRequestSentOn}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{candidate.skills}</TableCell>
                  <TableCell>{candidate.fullAddress}</TableCell>
                  <TableCell>{candidate.city}</TableCell>
                  <TableCell>{candidate.state}</TableCell>
                  <TableCell>{candidate.country}</TableCell>
                  <TableCell>{candidate.owner}</TableCell>
                  <TableCell>{candidate.lastEmailSentOn}</TableCell>
                  <TableCell>{candidate.lastCommunication}</TableCell>
                  <TableCell>{candidate.lastLinkedInMessageSentOn}</TableCell>
                  <TableCell>{candidate.postalCode}</TableCell>
                  <TableCell>{candidate.workHistory}</TableCell>
                  <TableCell>{candidate.educationHistory}</TableCell>
                  <TableCell>{candidate.hotlist ? 'Yes' : 'No'}</TableCell>
                  <TableCell className="text-right sticky right-0 bg-background">
                    <div className="flex gap-2 justify-end">
                      {candidate.resume_file_id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          title="View Resume"
                          onClick={() => handleViewResume(candidate.resume_file_id!)}
                        >
                          <FileText className="w-4 h-4 text-blue-600" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Send Email"
                        onClick={() => handleSendEmail(candidate.id, candidate.email)}
                      >
                        <Mail className="w-4 h-4 text-blue-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Send Offer"
                        onClick={() => handleSendOffer(candidate.id)}
                      >
                        <Send className="w-4 h-4 text-emerald-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Schedule Interview"
                        onClick={() => handleScheduleInterview(candidate.id)}
                      >
                        <Calendar className="w-4 h-4 text-amber-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Delete Candidate"
                        onClick={() => handleDeleteCandidate(candidate.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  )
}
