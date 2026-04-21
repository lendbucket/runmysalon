/**
 * Signup field validation utilities.
 * Used by both API routes and the Envy agent to validate inputs.
 */

// Valid IRS EIN prefixes (https://www.irs.gov/businesses/small-businesses-self-employed/how-eins-are-assigned-and-valid-ein-prefixes)
const VALID_EIN_PREFIXES = new Set([
  "01","02","03","04","05","06","10","11","12","13","14","15","16","20","21","22","23","24","25","26","27",
  "30","31","32","33","34","35","36","37","38","39","40","41","42","43","44","45","46","47","48","50","51",
  "52","53","54","55","56","57","58","59","60","61","62","63","64","65","66","67","68","71","72","73","74",
  "75","76","77","80","81","82","83","84","85","86","87","88","90","91","92","93","94","95","98","99",
])

const DUMMY_EINS = new Set(["12-3456789","11-1111111","00-0000000","22-2222222","33-3333333","99-9999999","12-3456780"])

const DUMMY_NAMES = new Set(["test","asdf","123","business","my business","salon","the salon","test salon","abc","xxx","zzz","none","na","n/a"])

const RESERVED_SLUGS = new Set([
  "www","portal","admin","api","app","auth","signup","login","help","support","status","docs","blog",
  "mail","email","smtp","ftp","cdn","assets","static","public","salonenvy","runmysalon","kasse",
  "reynapay","reynainsure","reynatech","sepa","devsalon","test","demo","staging","dev",
])

export const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
export const einRegex = /^\d{2}-?\d{7}$/
export const ssnRegex = /^\d{3}-?\d{2}-?\d{4}$/
export const phoneRegex = /^\+?1?\d{10}$/

export function validateEmail(email: string): string | null {
  if (!email) return "Email is required"
  if (!emailRegex.test(email)) return "Enter a valid email address"
  return null
}

export function validatePassword(password: string): string | null {
  if (!password) return "Password is required"
  if (password.length < 12) return "Password must be at least 12 characters"
  if (!/[a-zA-Z]/.test(password)) return "Password must contain a letter"
  if (!/[0-9]/.test(password)) return "Password must contain a number"
  if (!/[^a-zA-Z0-9]/.test(password)) return "Password must contain a special character"
  return null
}

export function validateBusinessName(name: string): string | null {
  if (!name) return "Business name is required"
  const lower = name.trim().toLowerCase()
  if (lower.length < 3) return "Business name must be at least 3 characters"
  if (lower.length > 80) return "Business name must be 80 characters or less"
  if (DUMMY_NAMES.has(lower)) return "Please enter your real business name"
  if (/^(.)\1+$/.test(lower)) return "Please enter your real business name"
  if (/^[0-9]+$/.test(lower)) return "Business name can't be only numbers"
  return null
}

export function validateEIN(ein: string, entityType?: string): string | null {
  if (!ein) {
    if (entityType && ["llc","s_corp","c_corp","partnership"].includes(entityType)) {
      return "EIN is required for " + entityType.replace("_"," ").toUpperCase() + " entities"
    }
    return null // Optional for sole proprietors
  }
  const normalized = ein.replace(/-/g, "")
  if (!/^\d{9}$/.test(normalized)) return "EIN must be 9 digits (XX-XXXXXXX)"
  const prefix = normalized.slice(0, 2)
  if (!VALID_EIN_PREFIXES.has(prefix)) return `EIN prefix ${prefix} is not a valid IRS prefix`
  const formatted = `${normalized.slice(0,2)}-${normalized.slice(2)}`
  if (DUMMY_EINS.has(formatted)) return "Please enter your real EIN"
  return null
}

export function validateSSN(ssn: string): string | null {
  if (!ssn) return "SSN is required"
  const normalized = ssn.replace(/-/g, "")
  if (!/^\d{9}$/.test(normalized)) return "SSN must be 9 digits (XXX-XX-XXXX)"
  if (/^(.)\1{8}$/.test(normalized)) return "Please enter a real SSN"
  if (normalized === "123456789") return "Please enter a real SSN"
  return null
}

export function validatePhone(phone: string): string | null {
  if (!phone) return "Phone number is required"
  const digits = phone.replace(/\D/g, "")
  if (digits.length === 10 || (digits.length === 11 && digits.startsWith("1"))) return null
  return "Enter a valid US phone number"
}

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40)
}

export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.has(slug)
}

export async function findUniqueSlug(baseSlug: string, prisma: any): Promise<string> {
  let slug = baseSlug
  let counter = 1
  while (true) {
    const existing = await prisma.tenant.findUnique({ where: { slug } })
    if (!existing && !isReservedSlug(slug)) return slug
    slug = `${baseSlug}-${counter}`
    counter++
    if (counter > 100) throw new Error("Could not generate unique slug")
  }
}

export const BUSINESS_CATEGORIES = [
  "hair_salon", "nail_salon", "barbershop", "med_spa", "esthetician",
  "full_service_spa", "combination", "brow_lash", "waxing", "massage",
  "tattoo_piercing", "other_beauty",
] as const

export const REVENUE_BRACKETS = [
  "under_100k", "100k_250k", "250k_1m", "1m_5m", "5m_plus", "not_sure",
] as const

export const ENTITY_TYPES = [
  "sole_prop", "llc", "s_corp", "c_corp", "partnership", "not_sure",
] as const

export const PLAN_TIERS = ["solo", "growth", "pro"] as const
