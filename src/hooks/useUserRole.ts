"use client"
import { useSession } from "next-auth/react"

export function useUserRole() {
  const { data: session } = useSession()
  const user = session?.user as Record<string, unknown> | undefined
  return {
    role: (user?.role as string) || "STYLIST",
    locationId: user?.locationId as string | undefined,
    locationName: user?.locationName as string | undefined,
    isOwner: user?.role === "OWNER",
    isManager: user?.role === "MANAGER",
    isStylist: user?.role === "STYLIST",
    canSeeAllLocations: user?.role === "OWNER",
  }
}
