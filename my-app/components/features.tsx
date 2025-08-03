"use client"

import { motion } from "framer-motion"
import { useInView } from "framer-motion"
import { useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Shield, Brain, Users, Search, Globe, Zap, Lock, AlertTriangle, Eye, Database } from "lucide-react"

const features = [
  {
    icon: Zap,
    title: "Real-time Scanning",
    description: "Multi-layered, real-time analysis of every URL before you visit.",
  },
  {
    icon: Brain,
    title: "AI-Powered Detection",
    description: "Gemini AI analyzes URLs and content for advanced threat patterns.",
  },
  {
    icon: Users,
    title: "Community Reporting",
    description: "Contribute to a community-driven database of emerging threats.",
  },
  {
    icon: Search,
    title: "URL Pattern Analysis",
    description: "Detects malicious URL structures, IP addresses, and redirects.",
  },
  {
    icon: Globe,
    title: "DNS & IP Verification",
    description: "Checks domain authenticity and IP reputation against blacklists.",
  },
  {
    icon: Lock,
    title: "SSL Certificate Validation",
    description: "Verifies SSL certificates and detects suspicious certificates.",
  },
  {
    icon: AlertTriangle,
    title: "Phishing Heuristics",
    description: "Advanced algorithms detect phishing attempts and social engineering.",
  },
  {
    icon: Eye,
    title: "Content Analysis",
    description: "Scans page content for suspicious forms and data collection.",
  },
  {
    icon: Database,
    title: "Threat Intelligence",
    description: "Real-time updates from global threat intelligence networks.",
  },
  {
    icon: Shield,
    title: "Zero-Day Protection",
    description: "Proactive defense against previously unknown threats.",
  },
]

export default function Features() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <section id="features" className="py-20 px-4" ref={ref}>
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6">
            Your{" "}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              10-Layer Shield
            </span>
          </h2>
          <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
            Comprehensive protection powered by advanced AI and community intelligence
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <Card className="h-full bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all duration-300 group hover:scale-105">
                <CardContent className="p-6">
                  <motion.div className="mb-4" whileHover={{ scale: 1.1, rotate: 5 }} transition={{ duration: 0.2 }}>
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center group-hover:shadow-lg transition-shadow">
                      <feature.icon className="h-6 w-6 text-white" />
                    </div>
                  </motion.div>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">{feature.title}</h3>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
