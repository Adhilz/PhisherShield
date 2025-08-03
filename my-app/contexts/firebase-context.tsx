"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import {
  type User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth"

interface FirebaseContextType {
  currentUser: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined)

export function useFirebase() {
  const context = useContext(FirebaseContext)
  if (context === undefined) {
    throw new Error("useFirebase must be used within a FirebaseProvider")
  }
  return context
}

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [auth, setAuth] = useState<any>(null)

  // Initialize Firebase auth only on client side
  useEffect(() => {
    const initializeAuth = async () => {
      if (typeof window !== "undefined") {
        try {
          console.log("🔥 Firebase: Initializing Firebase Auth...")
          const { auth: firebaseAuth } = await import("@/lib/firebase")
          setAuth(firebaseAuth)
          console.log("✅ Firebase: Auth initialized successfully")
        } catch (error) {
          console.error("❌ Firebase: Failed to initialize Firebase:", error)
          setLoading(false)
        }
      }
    }

    initializeAuth()
  }, [])

  const login = async (email: string, password: string) => {
    if (!auth) throw new Error("Firebase not initialized")
    console.log("🔥 Firebase: Attempting login for:", email)
    const result = await signInWithEmailAndPassword(auth, email, password)
    console.log("✅ Firebase: Login successful for user:", result.user.uid)
  }

  const signup = async (email: string, password: string) => {
    if (!auth) throw new Error("Firebase not initialized")
    console.log("🔥 Firebase: Attempting signup for:", email)
    const result = await createUserWithEmailAndPassword(auth, email, password)
    console.log("✅ Firebase: Signup successful for user:", result.user.uid)
  }

  const logout = async () => {
    if (!auth) throw new Error("Firebase not initialized")
    console.log("🔥 Firebase: Logging out user...")
    await signOut(auth)
    console.log("✅ Firebase: Logout successful")
  }

  useEffect(() => {
    if (!auth) return

    console.log("🔥 Firebase: Setting up auth state listener...")
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log("✅ Firebase: User authenticated:", user.uid, user.email)
      } else {
        console.log("🔥 Firebase: User not authenticated")
      }
      setCurrentUser(user)
      setLoading(false)
    })

    return unsubscribe
  }, [auth])

  const value: FirebaseContextType = {
    currentUser,
    loading,
    login,
    signup,
    logout,
  }

  return <FirebaseContext.Provider value={value}>{children}</FirebaseContext.Provider>
}
