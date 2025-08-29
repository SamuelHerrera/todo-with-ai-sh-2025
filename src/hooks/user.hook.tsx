'use client'

import type { User } from "@/types/user"
import { useState, useEffect, createContext } from "react"
import { usePathname, useRouter } from 'next/navigation'

export const UserContext = createContext<{
    user: User | null
    setUser: (user: User | null) => void
    token: string | null
    setToken: (token: string | null) => void
    isLoading: boolean
}>({
    user: null,
    setUser: () => { },
    token: null,
    setToken: () => { },
    isLoading: true
});


function UserContextProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [token, setToken] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const pathname = usePathname()
    const router = useRouter()

    useEffect(() => {
        try {
            const storedUser = localStorage.getItem('todoUser')
            const storedToken = localStorage.getItem('todoToken')
            if (storedUser?.trim()) {
                setUser(JSON.parse(storedUser))
            }
            if (storedToken?.trim()) {
                setToken(storedToken)
            }
        } catch (e) {
            console.error('Error parsing stored data:', e)
            localStorage.removeItem('todoUser')
            localStorage.removeItem('todoToken')
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        // Only run redirect logic after initial load is complete
        if (!isLoading) {
            if (user && token) {
                localStorage.setItem('todoUser', JSON.stringify(user))
                localStorage.setItem('todoToken', token)
                if (pathname === '/login') {
                    router.push('/')
                }
            } else {
                localStorage.removeItem('todoUser')
                localStorage.removeItem('todoToken')
                if (pathname !== '/login') {
                    router.push('/login')
                }
            }
        }
    }, [user, token, pathname, router, isLoading])

    return (
        <UserContext.Provider value={{ user, setUser, token, setToken, isLoading }}>
            {children}
        </UserContext.Provider>
    )
}

export default UserContextProvider;
