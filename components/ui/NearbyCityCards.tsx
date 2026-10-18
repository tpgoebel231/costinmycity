import Link from "next/link";

export function NearbyCityCards({
  heading,
  items,
}: {
  heading: string;
  items: { href: string; label: string }[];
}) {
  if (!items.length) return null;
  return (
    <div className="mt-6">
      <h3 className="text-xl">{heading}</h3>
      <ul className="nearby-grid mt-3">
        {items.map((item) => (
          <li key={item.href}>
            <Link href={item.href} className="nearby-card">
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
