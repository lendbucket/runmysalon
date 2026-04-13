export interface TDLRResult {
  valid: boolean
  holderName?: string
  licenseNumber?: string
  licenseType?: string
  expirationDate?: string | null
  status?: string
  county?: string
  originalIssueDate?: string
  source?: string
  error?: string
}

export async function verifyTDLRLicense(licenseNumber: string): Promise<TDLRResult> {
  const cleaned = licenseNumber.trim().replace(/\s+/g, "").replace(/-/g, "")

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let record: Record<string, any> | null = null

  // Strategy 1: Try multiple field names on the main TDLR dataset
  const queries = [
    `https://data.texas.gov/resource/7358-krk7.json?license_number=${cleaned}`,
    `https://data.texas.gov/resource/7358-krk7.json?lic_nbr=${cleaned}`,
    `https://data.texas.gov/resource/7358-krk7.json?$where=license_number='${cleaned}'`,
    `https://data.texas.gov/resource/7358-krk7.json?$where=lic_nbr='${cleaned}'`,
  ]

  // Strategy 2: Try the cosmetology-specific dataset
  const altQueries = [
    `https://data.texas.gov/resource/whvf-shnm.json?license_number=${cleaned}`,
    `https://data.texas.gov/resource/whvf-shnm.json?lic_nbr=${cleaned}`,
  ]

  const appToken = process.env.TDLR_APP_TOKEN || ""
  const headers: Record<string, string> = { Accept: "application/json" }
  if (appToken) headers["X-App-Token"] = appToken

  for (const url of [...queries, ...altQueries]) {
    try {
      const res = await fetch(url, { headers })
      if (!res.ok) continue
      const data = await res.json()
      if (Array.isArray(data) && data.length > 0) {
        record = data[0]
        console.log("[TDLR] Found via:", url, "keys:", Object.keys(record!))
        break
      }
    } catch (e) {
      console.log("[TDLR] Query failed:", url, e instanceof Error ? e.message : e)
      continue
    }
  }

  // Strategy 3: Scrape the TDLR public website as fallback
  if (!record) {
    try {
      const tdlrUrl = `https://www.tdlr.texas.gov/LicenseSearch/SearchResultDetail.asp?Ession=SessionID&SearchBy=LicNbr&LicNbr=${cleaned}`
      const res = await fetch(tdlrUrl, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; SalonEnvyPortal/1.0)", Accept: "text/html" },
      })
      if (res.ok) {
        const html = await res.text()
        console.log("[TDLR] Website response length:", html.length, "contains license?", html.includes(cleaned))

        // Try extracting data from the HTML
        const nameMatch = html.match(/(?:Name|Licensee)[:\s]*<[^>]*>([^<]+)</i)
        const expMatchSingle = html.match(/(?:Expir(?:ation|es)|Exp\.?\s*Date)[:\s]*<[^>]*>([^<]+)/i)
        const expMatchAll = html.match(/(\d{1,2}\/\d{1,2}\/\d{4})/g)
        const expDateStr = expMatchSingle?.[1]?.trim() || (expMatchAll ? expMatchAll[expMatchAll.length - 1] : "") || ""
        const statusMatch = html.match(/(?:License\s*)?Status[:\s]*<[^>]*>([^<]+)/i)
        const typeMatch = html.match(/(?:License\s*)?Type[:\s]*<[^>]*>([^<]+)/i)
        const countyMatch = html.match(/County[:\s]*<[^>]*>([^<]+)/i)
        const issueMatch = html.match(/(?:Original\s*)?Issue\s*Date[:\s]*<[^>]*>([^<]+)/i)

        if (nameMatch || statusMatch || html.toLowerCase().includes("active")) {
          record = {
            name: nameMatch?.[1]?.trim() || "",
            license_number: cleaned,
            expiration_date: expDateStr,
            status: statusMatch?.[1]?.trim() || "Active",
            license_type: typeMatch?.[1]?.trim() || "Cosmetologist",
            county: countyMatch?.[1]?.trim() || "",
            issue_date: issueMatch?.[1]?.trim() || "",
            source: "tdlr_website",
          }
          console.log("[TDLR] Found via website scrape:", JSON.stringify(record))
        }
      }
    } catch (e) {
      console.log("[TDLR] Website scrape failed:", e instanceof Error ? e.message : e)
    }
  }

  if (!record) {
    return { valid: false, error: "License not found in TDLR database. Verify the number at tdlr.texas.gov" }
  }

  // Map any field name variation to standard names
  const holderName = record.name || record.licensee_name || record.holder_name || record.lic_holder || ""
  const licType = record.license_type || record.lic_type || record.type || record.profession || ""
  const expDate = record.expiration_date || record.exp_date || record.expiry_date || record.license_expiration_date || record.expiration || ""
  const rawStatus = record.status || record.lic_status || record.license_status || "ACTIVE"
  const county = record.county || record.county_name || ""
  const issueDate = record.issue_date || record.original_issue_date || record.issued_date || ""
  const licNum = record.license_number || record.lic_nbr || record.license_no || cleaned

  let isExpired = false
  if (expDate) {
    try {
      isExpired = new Date(expDate) < new Date()
    } catch { /* not parseable */ }
  }

  const statusUpper = rawStatus.toUpperCase().trim()
  const isActive = statusUpper.includes("ACTIVE") || statusUpper.includes("CURRENT")
  const status = isExpired ? "EXPIRED" : isActive ? "ACTIVE" : statusUpper

  return {
    valid: !isExpired && isActive,
    holderName: holderName.trim(),
    licenseNumber: licNum,
    licenseType: licType.trim(),
    expirationDate: expDate || null,
    status,
    county: county.trim(),
    originalIssueDate: issueDate.trim(),
    source: record.source || "tdlr_api",
  }
}
