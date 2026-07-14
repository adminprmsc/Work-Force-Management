export function composePackageNameFromParts(
  cluster: string,
  tehsilDisplayName: string,
  code: string,
): string {
  const parts = [cluster, tehsilDisplayName, code]
    .map((part) => part.trim().replace(/\s+/g, " "))
    .filter(Boolean)
  return parts.join("-")
}

export function parsePackageNameParts(
  fullName: string,
  tehsilDisplayName: string,
): { cluster: string; code: string } {
  const tehsil = tehsilDisplayName.trim()
  if (!tehsil) {
    return { cluster: fullName.trim(), code: "" }
  }
  const marker = `-${tehsil}-`
  const idx = fullName.indexOf(marker)
  if (idx === -1) {
    return { cluster: fullName.trim(), code: "" }
  }
  return {
    cluster: fullName.slice(0, idx).trim(),
    code: fullName.slice(idx + marker.length).trim(),
  }
}

/** @deprecated Legacy space-separated naming — use composePackageNameFromParts. */
export function composePackageNameWithTehsil(
  namePart: string,
  tehsilDisplayName: string,
): string {
  const part = namePart.trim().replace(/\s+/g, " ")
  const tehsil = tehsilDisplayName.trim()
  if (!part) return tehsil
  if (!tehsil) return part
  if (part.toLowerCase().includes(tehsil.toLowerCase())) return part

  const firstSpace = part.indexOf(" ")
  if (firstSpace === -1) {
    return `${part} ${tehsil}`
  }

  const prefix = part.slice(0, firstSpace)
  const rest = part.slice(firstSpace + 1).trim()
  return `${prefix} ${tehsil}${rest ? ` ${rest}` : ""}`
}

export function stripTehsilFromPackageName(
  fullName: string,
  tehsilDisplayName: string,
): string {
  const tehsil = tehsilDisplayName.trim()
  if (!tehsil) return fullName.trim()

  const escaped = tehsil.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  return fullName
    .replace(new RegExp(`\\s${escaped}(?=\\s|$)`, "i"), " ")
    .replace(/\s+/g, " ")
    .trim()
}

export function formatCurrency(value: string | number): string {
  const numeric = typeof value === "number" ? value : Number.parseFloat(value)
  if (Number.isNaN(numeric)) return "—"
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    minimumFractionDigits: 2,
  }).format(numeric)
}
