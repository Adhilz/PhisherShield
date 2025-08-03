"use client"

import type React from "react"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { X, AlertTriangle, Globe, Shield, CheckCircle } from "lucide-react"
import { useFirebase } from "@/utils/use-firebase"

interface ReportModalProps {
  isOpen: boolean
  onClose: () => void
  isUserSignedIn: boolean
}

export default function ReportModal({ isOpen, onClose, isUserSignedIn }: ReportModalProps) {
  const [url, setUrl] = useState("")
  const [description, setDescription] = useState("")
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { currentUser } = useFirebase()

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUser) {
      setError("Please sign in to report malicious sites")
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Get Firebase ID token
      const idToken = await currentUser.getIdToken()

      // Prepare request data
      const requestData = {
        reportedUrl: url,
        reportDetails: description,
      }

      // Send report to backend
      const response = await fetch(`${BACKEND_URL}/api/report`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify(requestData),
      })

      if (!response.ok) {
        const errorText = await response.text()
        let errorMessage = "Failed to submit report. Please try again."

        try {
          const errorData = JSON.parse(errorText)
          errorMessage = errorData.message || errorMessage
        } catch {
          if (response.status === 401) {
            errorMessage = "Authentication failed. Please sign in again."
          } else if (response.status === 500) {
            errorMessage = "Server error. Please try again later."
          } else {
            errorMessage = "Network error. Please check your connection and try again."
          }
        }
        throw new Error(errorMessage)
      }

      const responseData = await response.json()
      setIsSubmitted(true)

      // Reset form after 3 seconds and close modal
      setTimeout(() => {
        setIsSubmitted(false)
        setUrl("")
        setDescription("")
        setError(null)
        onClose()
      }, 3000)
    } catch (err: any) {
      setError(err.message || "Failed to submit report. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setUrl("")
    setDescription("")
    setIsSubmitted(false)
    setError(null)
  }

  const handleClose = () => {
    if (!loading) {
      resetForm()
      onClose()
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", duration: 0.5 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg"
          >
            <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
              <CardHeader className="relative">
                {!loading && (
                  <button
                    onClick={handleClose}
                    className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
                <CardTitle className="text-2xl font-bold text-center text-slate-900 dark:text-white flex items-center justify-center gap-2">
                  <AlertTriangle className="h-6 w-6 text-red-500" />
                  Report Malicious Site
                </CardTitle>
                <p className="text-center text-slate-600 dark:text-slate-300">
                  Help protect the community by reporting suspicious websites
                </p>
              </CardHeader>

              <CardContent>
                {!isUserSignedIn || !currentUser ? (
                  <div className="text-center py-8">
                    <Shield className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Sign In Required</h3>
                    <p className="text-slate-600 dark:text-slate-300 mb-6">
                      Please sign in to your PhisherShield account to report malicious sites
                    </p>
                    <Button onClick={handleClose} className="bg-blue-600 hover:bg-blue-700 text-white">
                      Close
                    </Button>
                  </div>
                ) : isSubmitted ? (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-center py-8"
                  >
                    <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                      Report Submitted Successfully!
                    </h3>
                    <p className="text-slate-600 dark:text-slate-300 mb-4">
                      Thank you for helping keep the community safe. Our security team will review your report within 24
                      hours.
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      This window will close automatically in a few seconds.
                    </p>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="url" className="text-slate-700 dark:text-slate-300">
                        Suspicious Website URL *
                      </Label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <Input
                          id="url"
                          type="url"
                          placeholder="https://suspicious-website.com"
                          value={url}
                          onChange={(e) => setUrl(e.target.value)}
                          className="pl-10"
                          required
                          disabled={loading}
                        />
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Enter the complete URL of the suspicious website
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description" className="text-slate-700 dark:text-slate-300">
                        What makes this site suspicious?
                      </Label>
                      <Textarea
                        id="description"
                        placeholder="Describe the suspicious behavior (e.g., fake login form, phishing attempt, malware download, suspicious redirects, etc.)"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={4}
                        className="resize-none"
                        disabled={loading}
                      />
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Optional: Additional details help our team investigate faster
                      </p>
                    </div>

                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
                      >
                        <div className="flex items-start space-x-2">
                          <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                          <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
                        </div>
                      </motion.div>
                    )}

                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                      <div className="flex items-start space-x-2">
                        <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                        <div className="text-sm">
                          <p className="font-semibold text-blue-800 dark:text-blue-200 mb-1">Your Privacy</p>
                          <p className="text-blue-700 dark:text-blue-300">
                            Reports are submitted securely and help protect the entire PhisherShield community. Your
                            information is kept confidential.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex space-x-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleClose}
                        className="flex-1 bg-transparent"
                        disabled={loading}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
                        disabled={!url || loading}
                      >
                        {loading ? (
                          <div className="flex items-center">
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                              className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                            />
                            Submitting Report...
                          </div>
                        ) : (
                          "Submit Report"
                        )}
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
