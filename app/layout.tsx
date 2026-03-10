import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/lib/auth-context"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { Sidebar } from "@/components/dashboard/sidebar"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "EduTrack - Educational Management System",
  description: "Comprehensive educational management system for schools, teachers, students, and parents",
  keywords: ["education", "school management", "student tracking", "teacher portal", "parent dashboard"],
  generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <div className="flex h-screen overflow-hidden">
              {/* Sidebar */}
              <div className=" md:flex md:w-fit md:flex-col">
                <Sidebar />
              </div>
              
              {/* Main content area */}
              <div className="flex flex-1 flex-col overflow-hidden">
                {/* Mobile sidebar overlay would go here if needed */}
                
                {/* Main content */}
                <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
                  <div className="p-6">
                    {children}
                  </div>
                </main>
              </div>
            </div>
            
            <Toaster position="top-right" />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}