"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { Chrome } from "lucide-react"
import { useState } from "react"

export default function Hero() {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <section className="pt-32 pb-20 px-4">
      <div className="container mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="max-w-4xl mx-auto"
        >
          {/* Fishing Line Setup - Everything swings together */}
          <motion.div
            className="mb-8 flex justify-center relative h-32"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
          >
            {/* Complete fishing line + logo system that swings together */}
            <motion.div
              className="relative"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              animate={{
                rotate: isHovered ? [0, 15, -15, 8, -8, 0] : [0, 2, -2, 0],
              }}
              transition={{
                duration: isHovered ? 2.5 : 4,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }}
              style={{
                transformOrigin: "50% 0%", // Pivot point at the top
              }}
            >
              {/* Fishing Line */}
              <motion.div
                className="w-0.5 h-20 bg-gradient-to-b from-slate-600 to-slate-400 dark:from-slate-400 dark:to-slate-300 mx-auto"
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ duration: 0.8, delay: 0.7 }}
                style={{
                  boxShadow: "0 0 2px rgba(0,0,0,0.2)",
                }}
              />

              {/* Logo attached at the bottom of the string */}
              <motion.div
                className="relative cursor-pointer"
                animate={{
                  scale: isHovered ? [1, 1.1, 1] : [1, 1.02, 1],
                }}
                transition={{
                  duration: isHovered ? 1 : 3,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                }}
              >
                {/* Connection point - small knot where string meets logo */}
                <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-slate-500 dark:bg-slate-400 rounded-full shadow-sm" />

                {/* Logo as bait */}
                <div className="relative flex justify-center">
                  <Image
                    src="/images/phishershield-logo.png"
                    alt="PhisherShield Logo"
                    width={80}
                    height={80}
                    className="w-20 h-20 drop-shadow-2xl"
                  />

                  {/* Subtle glow effect around the logo */}
                  <motion.div
                    className="absolute inset-0 bg-blue-400/20 rounded-full blur-xl"
                    animate={{
                      scale: isHovered ? [1, 1.5, 1] : [1, 1.2, 1],
                      opacity: isHovered ? [0.3, 0.6, 0.3] : [0.2, 0.4, 0.2],
                    }}
                    transition={{
                      duration: isHovered ? 1.5 : 2.5,
                      repeat: Number.POSITIVE_INFINITY,
                      ease: "easeInOut",
                    }}
                  />
                </div>
              </motion.div>
            </motion.div>

            {/* Additional line tension effect */}
            <motion.div
              className="absolute top-0 left-1/2 transform -translate-x-1/2 w-0.5 h-20 bg-gradient-to-b from-transparent to-slate-300/30 origin-top pointer-events-none"
              animate={{
                opacity: isHovered ? [0.3, 0.6, 0.3] : [0.1, 0.3, 0.1],
              }}
              transition={{
                duration: isHovered ? 1.5 : 3,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }}
            />
          </motion.div>

          {/* Main Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.9 }}
            className="text-5xl md:text-7xl font-bold text-slate-900 dark:text-white mb-6 leading-tight"
          >
            Proactive Protection
            <br />
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Against Phishing
            </span>
          </motion.h1>

          {/* Sub-headline */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.1 }}
            className="text-xl md:text-2xl text-slate-600 dark:text-slate-300 mb-10 max-w-3xl mx-auto leading-relaxed"
          >
            PhisherShield is a multi-layered browser extension that secures your web experience in real-time with
            advanced AI-powered threat detection.
          </motion.p>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.3 }}
          >
            <Button
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              <Chrome className="mr-2 h-5 w-5" />
              Download for Chrome
            </Button>
          </motion.div>

          {/* Floating Elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div
              animate={{
                y: [0, -20, 0],
                x: [0, 10, 0],
              }}
              transition={{ duration: 6, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
              className="absolute top-1/4 left-1/4 w-2 h-2 bg-blue-400 rounded-full opacity-60"
            />
            <motion.div
              animate={{
                y: [0, 20, 0],
                x: [0, -15, 0],
              }}
              transition={{ duration: 8, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
              className="absolute top-1/3 right-1/4 w-3 h-3 bg-purple-400 rounded-full opacity-40"
            />
            <motion.div
              animate={{
                y: [0, -15, 0],
                x: [0, 20, 0],
              }}
              transition={{ duration: 7, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
              className="absolute bottom-1/3 left-1/3 w-2 h-2 bg-blue-300 rounded-full opacity-50"
            />
          </div>
        </motion.div>
      </div>
    </section>
  )
}
