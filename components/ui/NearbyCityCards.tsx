import Link from "next/link";

export function NearbyCityCards({
  heading,
  items,
}: {
  heading: string;
  items: { href: string; label: string; detail?: string }[];
}) {
  if (!items.length) return null;
  return (
    <div>
      <h2>{heading}</h2>
      <ul className="nearby-grid mt-3">
        {items.map((item) => (
          <li key={item.href}>
            <Link href={item.href} className="nearby-card">
              <span>{item.label}</span>
              {item.detail ? <span className="meta">{item.detail}</span> : null}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
