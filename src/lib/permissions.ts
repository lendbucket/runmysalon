import { prisma } from "@/lib/prisma"

export const FEATURES = [
  { key: "dashboard", label: "Dashboard", actions: ["view"] },
  { key: "appointments", label: "Appointments", actions: ["view", "create", "edit", "delete", "export"] },
  { key: "metrics", label: "Metrics", actions: ["view", "export"] },
  { key: "staff", label: "Staff", actions: ["view", "create", "edit", "delete"] },
  { key: "payroll", label: "Payroll", actions: ["view", "export", "approve"] },
  { key: "financials", label: "Financials", actions: ["view", "create", "edit", "export"] },
  { key: "performance", label: "Performance", actions: ["view", "goals_create", "goals_edit", "bonuses_approve"] },
  { key: "inventory", label: "Inventory", actions: ["view", "create", "edit", "delete"] },
  { key: "reviews", label: "Reviews", actions: ["view", "respond"] },
  { key: "complaints", label: "Complaints", actions: ["view", "create"] },
  { key: "conduct", label: "Conduct", actions: ["view", "create"] },
  { key: "onboarding", label: "Onboarding", actions: ["view", "create", "cancel"] },
  { key: "alerts", label: "Alerts", actions: ["view", "create", "dismiss"] },
  { key: "social", label: "Social Media", actions: ["view", "post", "analytics"] },
  { key: "reports", label: "Reports", actions: ["view", "export"] },
  { key: "settings", label: "Settings", actions: ["view", "edit"] },
  { key: "api_keys", label: "API Keys", actions: ["view", "create", "revoke"] },
] as const

// Build a helper to generate all-true permissions for a feature
function allActions(feature: typeof FEATURES[number]): Record<string, boolean> {
  const obj: Record<string, boolean> = {}
  for (const action of feature.actions) {
    obj[action] = true
  }
  return obj
}

// OWNER: everything enabled
function buildOwnerPermissions(): Record<string, Record<string, boolean>> {
  const perms: Record<string, Record<string, boolean>> = {}
  for (const f of FEATURES) {
    perms[f.key] = allActions(f)
  }
  return perms
}

// MANAGER: most things except destructive staff ops, settings edit, api_keys management, payroll approve
function buildManagerPermissions(): Record<string, Record<string, boolean>> {
  const perms: Record<string, Record<string, boolean>> = {}
  for (const f of FEATURES) {
    perms[f.key] = allActions(f)
  }
  // Restrict staff management
  perms.staff = { view: true, create: false, edit: true, delete: false }
  // Restrict payroll
  perms.payroll = { view: true, export: true, approve: false }
  // Restrict financials
  perms.financials = { view: true, create: false, edit: false, export: true }
  // Restrict performance
  perms.performance = { view: true, goals_create: true, goals_edit: true, bonuses_approve: false }
  // Restrict conduct
  perms.conduct = { view: true, create: true }
  // Restrict settings
  perms.settings = { view: true, edit: false }
  // No API key management
  perms.api_keys = { view: false, create: false, revoke: false }
  // Onboarding limited
  perms.onboarding = { view: true, create: true, cancel: false }
  return perms
}

// STYLIST: view-only for most, very limited actions
function buildStylistPermissions(): Record<string, Record<string, boolean>> {
  const perms: Record<string, Record<string, boolean>> = {}
  // Start with everything false
  for (const f of FEATURES) {
    const obj: Record<string, boolean> = {}
    for (const action of f.actions) {
      obj[action] = false
    }
    perms[f.key] = obj
  }
  // Stylists can view dashboard
  perms.dashboard = { view: true }
  // View own appointments
  perms.appointments = { view: true, create: true, edit: true, delete: false, export: false }
  // View own metrics
  perms.metrics = { view: true, export: false }
  // View own performance
  perms.performance = { view: true, goals_create: false, goals_edit: false, bonuses_approve: false }
  // View reviews
  perms.reviews = { view: true, respond: false }
  // View and create complaints
  perms.complaints = { view: true, create: true }
  // View alerts
  perms.alerts = { view: true, create: false, dismiss: true }
  // View inventory
  perms.inventory = { view: true, create: false, edit: false, delete: false }
  return perms
}

export const DEFAULT_PERMISSIONS: Record<string, Record<string, Record<string, boolean>>> = {
  OWNER: buildOwnerPermissions(),
  MANAGER: buildManagerPermissions(),
  STYLIST: buildStylistPermissions(),
}

/**
 * Check if a user has permission for a specific feature+action.
 * Priority: staffMemberId-specific → role+location → role-global → DEFAULT_PERMISSIONS fallback.
 */
export async function hasPermission(
  userId: string,
  role: string,
  feature: string,
  action: string,
  locationId?: string
): Promise<boolean> {
  // Look up the staff member for this user
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { staffMember: { select: { id: true } } },
  })
  const staffMemberId = user?.staffMember?.id

  // 1. Check staff-member-specific permission
  if (staffMemberId) {
    const staffPerm = await prisma.portalPermission.findFirst({
      where: {
        staffMemberId,
        feature,
        action,
      },
      orderBy: { updatedAt: "desc" },
    })
    if (staffPerm) return staffPerm.granted
  }

  // 2. Check role + location-specific permission
  if (locationId) {
    const locPerm = await prisma.portalPermission.findFirst({
      where: {
        role,
        locationId,
        staffMemberId: null,
        feature,
        action,
      },
      orderBy: { updatedAt: "desc" },
    })
    if (locPerm) return locPerm.granted
  }

  // 3. Check role-global permission (no location, no staff)
  const rolePerm = await prisma.portalPermission.findFirst({
    where: {
      role,
      locationId: null,
      staffMemberId: null,
      feature,
      action,
    },
    orderBy: { updatedAt: "desc" },
  })
  if (rolePerm) return rolePerm.granted

  // 4. Fall back to DEFAULT_PERMISSIONS
  return DEFAULT_PERMISSIONS[role]?.[feature]?.[action] ?? false
}
