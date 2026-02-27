'use client'

import { Briefcase, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface SidebarProps {
  activeSection: 'companies' | 'candidates' | 'jobs'
  onSectionChange: (section: 'companies' | 'candidates' | 'jobs') => void
}

export function Sidebar({ activeSection, onSectionChange }: SidebarProps) {
  return (
    <aside className="w-64 border-r border-border bg-sidebar p-6 flex flex-col">
      <h1 className="text-2xl font-bold text-sidebar-foreground mb-8">Recuritone</h1>

      <nav className="space-y-2 flex-1">
        <Button
          variant={activeSection === 'companies' ? 'default' : 'ghost'}
          className="w-full justify-start gap-2"
          onClick={() => onSectionChange('companies')}
        >
          <Briefcase className="w-4 h-4" />
          Companies
        </Button>

        <Button
          variant={activeSection === 'jobs' ? 'default' : 'ghost'}
          className="w-full justify-start gap-2"
          onClick={() => onSectionChange('jobs')}
        >
          <Briefcase className="w-4 h-4" />
          Jobs
        </Button>

        <Button
          variant={activeSection === 'candidates' ? 'default' : 'ghost'}
          className="w-full justify-start gap-2"
          onClick={() => onSectionChange('candidates')}
        >
          <Users className="w-4 h-4" />
          Candidates
        </Button>
      </nav>
    </aside>
  )
}
