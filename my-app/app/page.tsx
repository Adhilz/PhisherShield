"use client"

import { useState } from "react"
import { motion, useScroll, useTransform } from "framer-motion"
import Header from "@/components/header"
import Hero from "@/components/hero"
import Features from "@/components/features"
import Pricing from "@/components/pricing"
import About from "@/components/about"
import Footer from "@/components/footer"
import SignInModal from "@/components/sign-in-modal"
import ReportModal from "@/components/report-modal"
import PaymentModal from "@/components/payment-modal"
import { useFirebase } from "@/utils/use-firebase"

export default function LandingPage() {
  const [isSignInOpen, setIsSignInOpen] = useState(false)
  const [isReportOpen, setIsReportOpen] = useState(false)
  const [isPaymentOpen, setIsPaymentOpen] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<{
    name: string
    price: { monthly: number | string; yearly: number | string }
    isYearly: boolean
  } | null>(null)

  const { currentUser, loading: authLoading } = useFirebase()
  const { scrollYProgress } = useScroll()
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"])

  const handlePaymentClick = (plan: any, isYearly: boolean) => {
    setSelectedPlan({ ...plan, isYearly })
    setIsPaymentOpen(true)
  }

  const handleSignInRequired = () => {
    setIsSignInOpen(true)
  }

  const handleSignInSuccess = () => {
    setIsSignInOpen(false)
  }

  // Show loading state while Firebase initializes
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
          className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full"
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 transition-colors duration-300">
      {/* Parallax Background */}
      <motion.div style={{ y }} className="fixed inset-0 opacity-30 dark:opacity-20">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-100/50 to-purple-100/50 dark:from-blue-900/20 dark:to-purple-900/20" />
      </motion.div>

      <div className="relative z-10">
        <Header
          onSignInClick={() => setIsSignInOpen(true)}
          onReportClick={() => setIsReportOpen(true)}
          isUserSignedIn={!!currentUser}
        />
        <Hero />
        <Features />
        <Pricing
          isUserSignedIn={!!currentUser}
          onPaymentClick={handlePaymentClick}
          onSignInRequired={handleSignInRequired}
        />
        <About />
        <Footer />
      </div>

      <SignInModal isOpen={isSignInOpen} onClose={() => setIsSignInOpen(false)} onSignInSuccess={handleSignInSuccess} />
      <ReportModal isOpen={isReportOpen} onClose={() => setIsReportOpen(false)} isUserSignedIn={!!currentUser} />
      <PaymentModal isOpen={isPaymentOpen} onClose={() => setIsPaymentOpen(false)} selectedPlan={selectedPlan} />
    </div>
  )
}
