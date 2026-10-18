import { sanitizeCopy } from "@/lib/dashes";
import type { HubPermitBullet } from "@/lib/city-hub-deepen";

export function CityHubPermits({
  cityName,
  bullets,
}: {
  cityName: string;
  bullets: HubPermitBullet[];
}) {
  if (!bullets.length) return null;
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
      </div>
    </section>
  );
}