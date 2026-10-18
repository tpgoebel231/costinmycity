import { FeesCheckedBadge } from "@/components/ui/FeesCheckedBadge";
import { RangeBar } from "@/components/ui/RangeBar";
import { usd, numberFmt } from "@/lib/format";

function qtyPhrase(slug: string, qty: number): string {
  if (slug === "roof-replacement") return qty + " squares";
  if (slug === "hvac-replacement") return qty === 1 ? "1 system" : qty + " systems";
  return numberFmt(qty) + " sq ft";
}

function jobPhrase(shortName: string): string {
  if (shortName.startsWith("HVAC")) return shortName;
  return shortName.charAt(0).toLowerCase() + shortName.slice(1);
}

function laborLine(cityName: string, wage: number | null): string {
  if (wage == null || !Number.isFinite(wage)) {
    return "Labor adjusted for " + cityName + " construction wages";
  }
  const pct = Math.round((wage - 1) * 100);
  if (pct === 0) return cityName + " labor matches the national average";
  const dir = pct < 0 ? "below" : "above";
  return cityName + " labor runs " + Math.abs(pct) + "% " + dir + " the national average";
}

export function Hero({
  cityName,
  dept,
  jobShortName,
  projectSlug,
  quantity,
  typical,
  low,
  high,
  laborWageMultiplier,
  permitUsd,
  footnote,
  badgeLabel,
  badgeHref,
}: {
  cityName: string;
  dept: string;
  jobShortName: string;
  projectSlug: string;
  quantity: number;
  typical: number;
  low: number;
  high: number;
  laborWageMultiplier: number | null;
  permitUsd: number | null;
  footnote: string | null;
  badgeLabel: string;
  badgeHref: string;
}) {
  const parts = [laborLine(cityName, laborWageMultiplier)];
  if (permitUsd != null && permitUsd > 0) {
    parts.push(
      "includes the " +
        usd(permitUsd) +
        " " +
        dept +
        " permit for a typical " +
        jobPhrase(jobShortName) +
        " (" +
        qtyPhrase(projectSlug, quantity) +
        ")",
    );
  }
  const note = parts.join("; ") + ".";
  const lowLabel = usd(low);
  const highLabel = usd(high);

  return (
    <article
      className="card hero-card"
      data-hero-typical={typical}
      data-hero-low={low}
      data-hero-high={high}
      data-permit={permitUsd == null ? "" : String(permitUsd)}
      data-qty={quantity}
    >
      <p className="eyebrow">Typical</p>
      <p className="hero-num">{usd(typical)}</p>
      <p>
        Most projects <span className="chip num">{lowLabel} to {highLabel}</span>
      </p>
      <RangeBar low={low} typical={typical} high={high} lowLabel={lowLabel} highLabel={highLabel} />
      <div className="hero-badge">
        <FeesCheckedBadge label={badgeLabel} href={badgeHref} />
      </div>
      <div className="hero-note">
        <p>{note}</p>
        {footnote ? <p className="meta mt-2">{footnote}</p> : null}
      </div>
    </article>
  );
}
