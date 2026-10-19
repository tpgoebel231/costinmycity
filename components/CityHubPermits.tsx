import Link from "next/link";
import { sanitizeCopy } from "@/lib/dashes";
import type { HubPermitBullet } from "@/lib/city-hub-deepen";
import { getCities } from "@/lib/data";
import { cityHasPermitPage } from "@/lib/permit-page";

export function CityHubPermits({
  cityName,
  bullets,
}: {
  cityName: string;
  bullets: HubPermitBullet[];
}) {
  if (!bullets.length) return null;
  const city = getCities().find((item) => item.name === cityName);
  const permitHref = city && cityHasPermitPage(city) ? "/permits/" + city.slug + "/" : "";
  return (
    <section id="permits" className="section-gap">
      <h2>{"Permits in " + cityName}</h2>
      <div className="card mt-4">
        <ul className="permit-points">
          {bullets.map((bullet) => {
            const text = sanitizeCopy(bullet.text);
            return (
              <li key={text}>
                {bullet.href ? (
                  <a className="permit-link" href={bullet.href} target="_blank" rel="noreferrer">
                    {text}
                  </a>
                ) : (
                  text
                )}
              </li>
            );
          })}
        </ul>
        {permitHref ? (
          <p className="mt-3">
            <Link href={permitHref}>{"All building permit fees in " + cityName}</Link>
          </p>
        ) : null}
      </div>
    </section>
  );
}