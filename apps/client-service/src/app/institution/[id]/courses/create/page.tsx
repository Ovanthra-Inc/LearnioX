"use client"

import React, { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { apiClient, ApiResponse } from "@/lib/api"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { InstitutionSidebar } from "@/components/institution/institution-sidebar"
import { InstitutionNavbar } from "@/components/institution/institution-navbar"
import { CourseCreateStepper } from "@/components/institution/studio/course-create-stepper"

export default function CreateCoursePage() {
  const params = useParams()
  const router = useRouter()
  const institutionId = (params?.id as string) || "650df5bf-a541-40e6-91bc-a5b09a1daadc"

  // Fetch Institution Info for Sidebar & Navbar
  const { data: instData } = useQuery({
    queryKey: ["institution-detail", institutionId],
    queryFn: async () => {
      try {
        const res = await apiClient.get<any, ApiResponse<any>>(`/institutions/${institutionId}`)
        return res.data
      } catch {
        return {
          id: institutionId,
          name: "Ovanthra Institute of Technology",
          slug: "ovanthra-tech",
          logo_url: null,
          role: "OWNER",
        }
      }
    },
  })

  const inst = instData || {
    id: institutionId,
    name: "Ovanthra Institute of Technology",
    slug: "ovanthra-tech",
    role: "OWNER",
  }

  return (
    <SidebarProvider defaultOpen={true}>
      {/* Institution Studio Sidebar */}
      <InstitutionSidebar
        institution={{
          id: inst.id,
          name: inst.name,
          slug: inst.slug,
          role: inst.role || "OWNER",
        }}
        activeTab="courses"
        onTabChange={(tab) => router.push(`/institution/${institutionId}?tab=${tab}`)}
      />

      {/* Main Workspace Inset & Top Navbar */}
      <SidebarInset className="relative flex min-h-svh flex-col bg-background text-foreground">
        <InstitutionNavbar
          institution={{
            id: inst.id,
            name: inst.name,
            slug: inst.slug,
            role: inst.role || "OWNER",
          }}
          activeTabTitle="Course Studio (Create Track)"
          isAdminOrOwner={true}
          onInviteClick={() => router.push(`/institution/${institutionId}?tab=members`)}
        />

        {/* Studio Body with Multi-Step Creator */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 space-y-4">
          <CourseCreateStepper
            institutionId={institutionId}
            onCancel={() => router.push(`/institution/${institutionId}?tab=courses`)}
            onComplete={() => router.push(`/institution/${institutionId}?tab=courses`)}
          />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
