"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { useInView } from "framer-motion"
import { useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Check, Star } from "lucide-react"

const plans = [
  {
    name: "Free",
    price: { monthly: 0, yearly: 0 },
    description: "Essential protection for personal use",
    features: [
      "Basic URL scanning",
      "Community threat database",
      "Chrome extension",
      "Limited to 100 scans/day",
      "Basic phishing detection",
    ],
    popular: false,
  },
  {
    name: "Pro",
    price: { monthly: 5, yearly: 50 },
    description: "Advanced protection with unlimited scans",
    features: [
      "Unlimited URL scanning",
      "AI-powered threat detection",
      "Real-time protection",
      "Detailed security reports",
      "Priority support",
      "Advanced heuristics",
      "Custom whitelist/blacklist",
    ],
    popular: true,
  },
  {
    name: "Enterprise",
    price: { monthly: "Contact", yearly: "Contact" },
    description: "Complete solution for organizations",
    features: [
      "Everything in Pro",
      "Centralized dashboard",
      "Team management",
      "API access",
      "Custom integrations",
      "Dedicated support",
      "SLA guarantee",
      "Advanced analytics",
    ],
    popular: false,
  },
]

interface PricingProps {
  isUserSignedIn: boolean
  onPaymentClick: (plan: any, isYearly: boolean) => void
  onSignInRequired: () => void
}

export default function Pricing({ isUserSignedIn, onPaymentClick, onSignInRequired }: PricingProps) {
  const [isYearly, setIsYearly] = useState(false)
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  const handlePlanClick = (plan: any) => {
    if (plan.name === "Free") {
      // Handle free plan - maybe redirect to download
      return
    }

    if (plan.name === "Enterprise") {
      // Handle enterprise contact
      window.location.href =
        "mailto:adhisalam200@gmail.com?subject=Enterprise Plan Inquiry&body=Hi, I'm interested in the PhisherShield Enterprise plan. Please provide more information."
      return
    }

    if (isUserSignedIn) {
      onPaymentClick(plan, isYearly)
    } else {
      onSignInRequired()
    }
  }

  return (
    <section id="pricing" className="py-20 px-4 bg-slate-50 dark:bg-slate-900/50" ref={ref}>
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6">
            Plans that Scale with{" "}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Your Needs
            </span>
          </h2>
          <p className="text-xl text-slate-600 dark:text-slate-300 mb-8">
            Choose the perfect plan for your security requirements
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center space-x-4 mb-12">
            <span
              className={`text-sm ${!isYearly ? "text-slate-900 dark:text-white font-semibold" : "text-slate-500"}`}
            >
              Monthly
            </span>
            <button
              onClick={() => setIsYearly(!isYearly)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isYearly ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-600"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isYearly ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
            <span className={`text-sm ${isYearly ? "text-slate-900 dark:text-white font-semibold" : "text-slate-500"}`}>
              Yearly
            </span>
            {isYearly && (
              <span className="text-sm bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded-full">
                Save 17%
              </span>
            )}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              className={`relative ${plan.popular ? "scale-105" : ""}`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-semibold flex items-center">
                    <Star className="h-4 w-4 mr-1" />
                    Most Popular
                  </div>
                </div>
              )}

              <Card
                className={`h-full cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 ${
                  plan.popular
                    ? "bg-white dark:bg-slate-800 border-2 border-blue-500 shadow-xl"
                    : "bg-white/70 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700"
                } backdrop-blur-sm`}
                onClick={() => handlePlanClick(plan)}
              >
                <CardHeader className="text-center pb-8">
                  <CardTitle className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{plan.name}</CardTitle>
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-slate-900 dark:text-white">
                      {typeof plan.price.monthly === "number"
                        ? `$${isYearly ? plan.price.yearly : plan.price.monthly}`
                        : plan.price.monthly}
                    </span>
                    {typeof plan.price.monthly === "number" && plan.price.monthly > 0 && (
                      <span className="text-slate-500 dark:text-slate-400">/{isYearly ? "year" : "month"}</span>
                    )}
                  </div>
                  <p className="text-slate-600 dark:text-slate-300">{plan.description}</p>
                </CardHeader>

                <CardContent className="pt-0">
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start">
                        <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-slate-600 dark:text-slate-300">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    className={`w-full ${
                      plan.popular
                        ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                        : "bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100"
                    } transition-all duration-300`}
                    size="lg"
                    onClick={(e) => {
                      e.stopPropagation()
                      handlePlanClick(plan)
                    }}
                  >
                    {plan.name === "Free"
                      ? "Get Started"
                      : plan.name === "Enterprise"
                        ? "Contact Sales"
                        : isUserSignedIn
                          ? "Subscribe Now"
                          : "Sign In to Subscribe"}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
