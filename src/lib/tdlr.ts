export async function verifyTDLRLicense(licenseNumber: string): Promise<{
  valid: boolean
  holderName?: string
  licenseType?: string
  expirationDate?: string | null
  status?: string
  error?: string
}> {
  try {
    const url = `https://data.texas.gov/resource/7358-krk7.json?license_number=${encodeURIComponent(licenseNumber)}`
    const response = await fetch(url, { next: { revalidate: 3600 } })
    if (!response.ok) return { valid: false, error: "TDLR API error" }
    const data = await response.json() as Array<Record<string, string>>
    if (!data || data.length === 0) return { valid: false, error: "License not found" }
    const record = data[0]
    const status = record.license_status || record.status || ""
    const expDate = record.license_expiration_date || record.expiration_date || null
    const isActive = status.toLowerCase() === "active" || status.toLowerCase() === "current"
    const isExpired = expDate ? new Date(expDate) < new Date() : false
    return {
      valid: isActive && !isExpired,
      holderName: record.name || record.license_holder_name || record.full_name || undefined,
      licenseType: record.license_type || record.license_sub_type || undefined,
      expirationDate: expDate,
      status: isExpired ? "EXPIRED" : isActive ? "ACTIVE" : status,
    }
  } catch (err: unknown) {
    return { valid: false, error: err instanceof Error ? err.message : "Unknown error" }
  }
}
