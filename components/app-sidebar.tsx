'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Briefcase, Users, Building2, LayoutDashboard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function AppSidebar() {
    const pathname = usePathname()

    return (
        <aside className="w-64 border-r border-border bg-sidebar p-6 flex flex-col h-screen sticky top-0">
            <h1 className="text-2xl font-bold text-sidebar-foreground mb-8">Recruitone</h1>

            <nav className="space-y-2 flex-1">
                <Link href="/">
                    <Button
                        variant={pathname === '/' ? 'default' : 'ghost'}
                        className="w-full justify-start gap-2 mb-2"
                    >
                        <LayoutDashboard className="w-4 h-4" />
                        Dashboard
                    </Button>
                </Link>
                <Link href="/companies">
                    <Button
                        variant={pathname.startsWith('/companies') ? 'default' : 'ghost'}
                        className="w-full justify-start gap-2 mb-2"
                    >
                        <Building2 className="w-4 h-4" />
                        Companies
                    </Button>
                </Link>

                <Link href="/jobs">
                    <Button
                        variant={pathname.startsWith('/jobs') ? 'default' : 'ghost'}
                        className="w-full justify-start gap-2 mb-2"
                    >
                        <Briefcase className="w-4 h-4" />
                        Jobs
                    </Button>
                </Link>

                <Link href="/candidates">
                    <Button
                        variant={pathname.startsWith('/candidates') ? 'default' : 'ghost'}
                        className="w-full justify-start gap-2 mb-2"
                    >
                        <Users className="w-4 h-4" />
                        Candidates
                    </Button>
                </Link>
            </nav>
        </aside>
    )
}
