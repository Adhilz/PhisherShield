"use client"

import type React from "react"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { X, CreditCard, Lock, Calendar, User, CheckCircle } from "lucide-react"

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  selectedPlan: {
    name: string
    price: { monthly: number | string; yearly: number | string }
    isYearly: boolean
  } | null
}

export default function PaymentModal({ isOpen, onClose, selectedPlan }: PaymentModalProps) {
  const [cardNumber, setCardNumber] = useState("")
  const [expiryDate, setExpiryDate] = useState("")
  const [cvv, setCvv] = useState("")
  const [cardName, setCardName] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsProcessing(true)

    // Simulate payment processing
    await new Promise((resolve) => setTimeout(resolve, 3000))

    setIsProcessing(false)
    setIsSuccess(true)

    // Reset and close after success
    setTimeout(() => {
      setIsSuccess(false)
      setCardNumber("")
      setExpiryDate("")
      setCvv("")
      setCardName("")
      onClose()
    }, 3000)
  }

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "")
    const matches = v.match(/\d{4,16}/g)
    const match = (matches && matches[0]) || ""
    const parts = []

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4))
    }

    if (parts.length) {
      return parts.join(" ")
    } else {
      return v
    }
  }

  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\D/g, "")
    if (v.length >= 2) {
      return `${v.substring(0, 2)}/${v.substring(2, 4)}`
    }
    return v
  }

  const handleClose = () => {
    if (!isProcessing) {
      setIsSuccess(false)
      setCardNumber("")
      setExpiryDate("")
      setCvv("")
      setCardName("")
      onClose()
    }
  }

  if (!selectedPlan) return null

  const price = selectedPlan.isYearly ? selectedPlan.price.yearly : selectedPlan.price.monthly
  const period = selectedPlan.isYearly ? "year" : "month"

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
            className="w-full max-w-md"
          >
            <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
              <CardHeader className="relative">
                {!isProcessing && (
                  <button
                    onClick={handleClose}
                    className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}

                {!isSuccess ? (
                  <>
                    <div className="flex items-center justify-center mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                        <CreditCard className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <CardTitle className="text-2xl font-bold text-center text-slate-900 dark:text-white">
                      Complete Payment
                    </CardTitle>
                    <div className="text-center">
                      <p className="text-slate-600 dark:text-slate-300">{selectedPlan.name} Plan</p>
                      <p className="text-2xl font-bold text-slate-900 dark:text-white">
                        ${price}/{period}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-center mb-4">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center"
                      >
                        <CheckCircle className="h-6 w-6 text-white" />
                      </motion.div>
                    </div>
                    <CardTitle className="text-2xl font-bold text-center text-slate-900 dark:text-white">
                      Payment Successful!
                    </CardTitle>
                    <p className="text-center text-slate-600 dark:text-slate-300">
                      Welcome to PhisherShield {selectedPlan.name}
                    </p>
                  </>
                )}
              </CardHeader>

              <CardContent>
                {!isSuccess ? (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="cardName" className="text-slate-700 dark:text-slate-300">
                        Cardholder Name
                      </Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <Input
                          id="cardName"
                          type="text"
                          placeholder="John Doe"
                          value={cardName}
                          onChange={(e) => setCardName(e.target.value)}
                          className="pl-10"
                          required
                          disabled={isProcessing}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cardNumber" className="text-slate-700 dark:text-slate-300">
                        Card Number
                      </Label>
                      <div className="relative">
                        <CreditCard className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <Input
                          id="cardNumber"
                          type="text"
                          placeholder="1234 5678 9012 3456"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                          className="pl-10"
                          maxLength={19}
                          required
                          disabled={isProcessing}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="expiryDate" className="text-slate-700 dark:text-slate-300">
                          Expiry Date
                        </Label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                          <Input
                            id="expiryDate"
                            type="text"
                            placeholder="MM/YY"
                            value={expiryDate}
                            onChange={(e) => setExpiryDate(formatExpiryDate(e.target.value))}
                            className="pl-10"
                            maxLength={5}
                            required
                            disabled={isProcessing}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="cvv" className="text-slate-700 dark:text-slate-300">
                          CVV
                        </Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                          <Input
                            id="cvv"
                            type="text"
                            placeholder="123"
                            value={cvv}
                            onChange={(e) => setCvv(e.target.value.replace(/\D/g, ""))}
                            className="pl-10"
                            maxLength={4}
                            required
                            disabled={isProcessing}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                      <div className="flex items-center">
                        <Lock className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-3" />
                        <div className="text-sm text-blue-800 dark:text-blue-200">
                          <p className="font-semibold">Secure Payment</p>
                          <p>Your payment information is encrypted and secure.</p>
                        </div>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={isProcessing || !cardNumber || !expiryDate || !cvv || !cardName}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white disabled:opacity-50"
                      size="lg"
                    >
                      {isProcessing ? (
                        <div className="flex items-center">
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                            className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                          />
                          Processing Payment...
                        </div>
                      ) : (
                        `Pay $${price}/${period}`
                      )}
                    </Button>
                  </form>
                ) : (
                  <div className="text-center py-8">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <p className="text-slate-600 dark:text-slate-300 mb-4">
                        Your subscription is now active. You can download the extension and start protecting your
                        browsing experience.
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        This window will close automatically in a few seconds.
                      </p>
                    </motion.div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
