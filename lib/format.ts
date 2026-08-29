export function usd(n: number | null | undefined, opts?: { compact?: boolean }): string {
  if (n == null || Number.isNaN(n)) return "—";
  const rounded = Math.round(n);
  if (opts?.compact && Math.abs(rounded) >= 1000) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(rounded);
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(rounded);
}

export function usdRange(low: number | null | undefined, high: number | null | undefined): string {
  if (low == null && high == null) return "Fee not yet recorded";
  if (low == null) return "up to " + usd(high);
  if (high == null) return "from " + usd(low);
  if (low === high) return usd(low);
  return usd(low) + " – " + usd(high);
}

export function numberFmt(n: number, digits = 0): string {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(n);
}

export function formatDate(iso: string | undefined | null): string {
  if (!iso) return "Date not recorded";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "America/New_York",
  }).format(d);
}

export function titleCaseSlug(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function feeModelLabel(model: string | undefined): string {
  switch (model) {
    case "flat": return "Flat fee";
    case "valuation": return "Based on project value";
    case "per_sqft": return "Per square foot";
    case "per_square": return "Per roofing square";
    case "sliding": return "Sliding scale";
    case "hourly": return "Hourly / time-based";
    case "none": return "No permit fee";
    case "unknown": return "Not yet recorded";
    default: return model ? model.replace(/_/g, " ") : "Not yet recorded";
  }
}
