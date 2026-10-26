import Link from "next/link";

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  if (!items.length) return null;
  const last = items.length - 1;
  return (
    <nav aria-label="Breadcrumb" className="crumb">
      <ol>
        {items.map((item, index) => {
          const current = index === last;
          return (
            <li key={index}>
              {index > 0 ? <span aria-hidden="true">{" / "}</span> : null}
              {current || !item.href ? (
                <span aria-current={current ? "page" : undefined}>{item.label}</span>
              ) : (
                <Link href={item.href}>{item.label}</Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
