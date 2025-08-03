"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { Sun, Moon, Menu, X, LogOut } from "lucide-react"
import { useTheme } from "next-themes"
import { useFirebase } from "@/utils/use-firebase"

interface HeaderProps {
  onSignInClick: () => void
  onReportClick: () => void
  isUserSignedIn: boolean
}

export default function Header({ onSignInClick, onReportClick, isUserSignedIn }: HeaderProps) {
  const { theme, setTheme } = useTheme()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { currentUser, logout } = useFirebase()

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: "smooth" })
    }
    setIsMobileMenuOpen(false)
  }

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-700"
    >
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <motion.div className="flex items-center space-x-2" whileHover={{ scale: 1.05 }}>
            <Image
              src="/images/phishershield-logo.png"
              alt="PhisherShield Logo"
              width={40}
              height={40}
              className="w-10 h-10" // Adjust size as needed
            />
            <span className="text-xl font-bold text-slate-900 dark:text-white">PhisherShield</span>
          </motion.div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <button
              onClick={() => scrollToSection("features")}
              className="text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection("pricing")}
              className="text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              Pricing
            </button>
            <button
              onClick={() => scrollToSection("about")}
              className="text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              About Us
            </button>
            <button
              onClick={onReportClick}
              className="text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              Report Site
            </button>
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            {currentUser ? (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-slate-600 dark:text-slate-300">{currentUser.email}</span>
                <Button variant="ghost" size="icon" onClick={handleLogout} title="Sign Out">
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button variant="ghost" onClick={onSignInClick}>
                Sign In
              </Button>
            )}
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">Download</Button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-2">
            <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden mt-4 pb-4 border-t border-slate-200 dark:border-slate-700"
          >
            <div className="flex flex-col space-y-4 pt-4">
              <button
                onClick={() => scrollToSection("features")}
                className="text-left text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                Features
              </button>
              <button
                onClick={() => scrollToSection("pricing")}
                className="text-left text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                Pricing
              </button>
              <button
                onClick={() => scrollToSection("about")}
                className="text-left text-slate-600 dark:text-slate-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                About Us
              </button>
              <button
                onClick={onReportClick}
                className="text-left text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                Report Site
              </button>
              <div className="flex space-x-2 pt-2">
                {currentUser ? (
                  <div className="flex items-center justify-between w-full">
                    <span className="text-sm text-slate-600 dark:text-slate-300">{currentUser.email}</span>
                    <Button variant="ghost" size="sm" onClick={handleLogout}>
                      Sign Out
                    </Button>
                  </div>
                ) : (
                  <Button variant="ghost" onClick={onSignInClick} className="flex-1">
                    Sign In
                  </Button>
                )}
                <Button className="bg-blue-600 hover:bg-blue-700 text-white flex-1">Download</Button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.header>
  )
}
