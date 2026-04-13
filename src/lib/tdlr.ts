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

  // Strategy 1: TDLR License Search via POST (correct endpoint)
  try {
    const formData = new URLSearchParams()
    formData.append("searchby", "LIC")
    formData.append("status", "A")
    formData.append("licno", cleaned)
    formData.append("stype", "H")
    formData.append("name", "")
    formData.append("city", "")
    formData.append("county", "0")
    formData.append("zip", "")

    const res = await fetch("https://www.tdlr.texas.gov/LicenseSearch/licfile.asp", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Referer": "https://www.tdlr.texas.gov/LicenseSearch/",
        "Accept": "text/html,application/xhtml+xml",
      },
      body: formData.toString(),
    })

    if (res.ok) {
      const html = await res.text()
      console.log("[TDLR POST] Response length:", html.length)
      console.log("[TDLR POST] Snippet:", html.substring(0, 500))

      if (!html.includes("No records found") && !html.includes("no records") && html.length > 500) {
        const nameMatch = html.match(/([A-Z]+,\s+[A-Z][A-Z\s]+?)(?=\s*<\/td>|\s*<br)/i)
        const licNumMatch = html.match(/>\s*(\d{6,8})\s*<\/td>/i)
        const dateMatches = html.match(/\d{2}\/\d{2}\/\d{4}/g) || []
        const activeMatch = html.toLowerCase().includes("active")
        const expiredMatch = html.toLowerCase().includes("expired")
        const licTypeMatch = html.match(/>(Cosmetologist[^<]*|Barber[^<]*|Esthetician[^<]*|Manicurist[^<]*)<\/td>/i)
        const cosmetMatch = html.match(/Cosmetologist[^<]*/i)
        const countyMatch = html.match(/County[:\s]*([A-Z]+)/i)

        if (nameMatch || licNumMatch || dateMatches.length > 0) {
          const expDate = dateMatches[0] || ""
          const issueDate = dateMatches.length > 1 ? dateMatches[dateMatches.length - 1] : ""
          const status = expiredMatch ? "EXPIRED" : activeMatch ? "ACTIVE" : "UNKNOWN"

          let isExpired = false
          if (expDate) {
            const [month, day, year] = expDate.split("/")
            isExpired = new Date(parseInt(year), parseInt(month) - 1, parseInt(day)) < new Date()
          }

          console.log("[TDLR POST] Parsed:", { name: nameMatch?.[1], expDate, status, licType: licTypeMatch?.[1] })

          return {
            valid: !isExpired && status === "ACTIVE",
            holderName: nameMatch?.[1]?.trim() || "",
            licenseNumber: licNumMatch?.[1]?.trim() || cleaned,
            licenseType: licTypeMatch?.[1]?.trim() || cosmetMatch?.[0]?.trim() || "Cosmetologist",
            expirationDate: expDate,
            originalIssueDate: issueDate !== expDate ? issueDate : "",
            status: isExpired ? "EXPIRED" : status,
            county: countyMatch?.[1]?.trim() || "",
            source: "tdlr_website",
          }
        }
      } else {
        console.log("[TDLR POST] No records found")
      }
    }
  } catch (e) {
    console.log("[TDLR POST] failed:", e instanceof Error ? e.message : e)
  }

  // Strategy 2: TDLR GET request
  try {
    const url = `https://www.tdlr.texas.gov/LicenseSearch/licfile.asp?searchby=LIC&status=A&licno=${cleaned}&stype=H&name=&city=&county=0&zip=`
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept: "text/html",
      },
    })

    if (res.ok) {
      const html = await res.text()
      console.log("[TDLR GET] Response length:", html.length, "contains license:", html.includes(cleaned))

      if (!html.includes("No records") && html.length > 1000) {
        const nameMatch = html.match(/([A-Z]{2,},\s+[A-Z][A-Z\s]+?)(?=\s*<\/td>)/i)
        const dateMatches = html.match(/\d{2}\/\d{2}\/\d{4}/g) || []
        const licTypeMatch = html.match(/>(Cosmetologist[^<]*|Barber[^<]*|Esthetician[^<]*)<\/td>/i)
        const countyMatch = html.match(/County[:\s]*([A-Z]+)/i)
        const activeMatch = html.toLowerCase().includes("active")

        if (nameMatch || dateMatches.length > 0) {
          const expDate = dateMatches[0] || ""
          const issueDate = dateMatches.length > 1 ? dateMatches[dateMatches.length - 1] : ""

          let isExpired = false
          if (expDate) {
            const [m, d, y] = expDate.split("/")
            isExpired = new Date(parseInt(y), parseInt(m) - 1, parseInt(d)) < new Date()
          }

          return {
            valid: !isExpired && activeMatch,
            holderName: nameMatch?.[1]?.trim() || "",
            licenseNumber: cleaned,
            licenseType: licTypeMatch?.[1]?.trim() || "Cosmetologist",
            expirationDate: expDate,
            originalIssueDate: issueDate !== expDate ? issueDate : "",
            status: isExpired ? "EXPIRED" : "ACTIVE",
            county: countyMatch?.[1]?.trim() || "",
            source: "tdlr_website_get",
          }
        }
      }
    }
  } catch (e) {
    console.log("[TDLR GET] failed:", e instanceof Error ? e.message : e)
  }

  // Strategy 3: Texas Open Data Portal with multiple datasets and field names
  const datasets = [
    "https://data.texas.gov/resource/7358-krk7.json",
    "https://data.texas.gov/resource/whvf-shnm.json",
    "https://data.texas.gov/resource/9t4d-g5h8.json",
    "https://data.texas.gov/resource/ibi4-56rc.json",
  ]

  for (const dataset of datasets) {
    const attempts = [
      `${dataset}?license_nbr=${cleaned}`,
      `${dataset}?lic_nbr=${cleaned}`,
      `${dataset}?license_number=${cleaned}`,
      `${dataset}?$where=license_nbr=%27${cleaned}%27`,
      `${dataset}?$where=lic_nbr=%27${cleaned}%27`,
    ]

    for (const url of attempts) {
      try {
        const res = await fetch(url, { headers: { Accept: "application/json" } })
        if (!res.ok) continue
        const data = await res.json()
        if (Array.isArray(data) && data.length > 0) {
          const r = data[0]
          console.log("[TDLR OpenData] Found via:", url, "keys:", Object.keys(r))

          const holderName = r.name || r.licensee_name || r.license_holder || r.holder_name || r.full_name || ""
          const expDate = r.expiration_date || r.exp_date || r.expiry || r.expire_date || ""
          const rawStatus = r.status || r.license_status || r.lic_status || "ACTIVE"
          const licType = r.license_type || r.lic_type || r.type || r.profession || "Cosmetologist"
          const county = r.county || r.county_name || ""
          const issueDate = r.original_issue_date || r.issue_date || r.issued || ""

          let isExpired = false
          if (expDate) {
            try { isExpired = new Date(expDate) < new Date() } catch { /* skip */ }
          }

          return {
            valid: !isExpired,
            holderName: String(holderName).trim(),
            licenseNumber: r.license_nbr || r.lic_nbr || r.license_number || cleaned,
            licenseType: String(licType).trim(),
            expirationDate: expDate || null,
            originalIssueDate: String(issueDate),
            status: isExpired ? "EXPIRED" : String(rawStatus).toUpperCase(),
            county: String(county).trim(),
            source: "open_data",
          }
        }
      } catch { continue }
    }
  }

  return { valid: false, error: "License not found. Please verify the number at tdlr.texas.gov" }
}
