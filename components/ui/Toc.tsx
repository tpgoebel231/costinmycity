export function Toc({ items }: { items: { href: string; label: string }[] }) {
  if (!items.length) return null;
  return (
    <>
      <nav className="toc-desk" aria-label="On this page">
        {items.map((item) => (
          <a key={item.href} href={item.href}>
            {item.label}
          </a>
        ))}
      </nav>
      <details className="toc-mob fold">
        <summary>
          <span className="fold-title">On this page</span>
        </summary>
        <ul className="pb-2">
          {items.map((item) => (
            <li key={item.href}>
              <a href={item.href}>{item.label}</a>
            </li>
          ))}
        </ul>
      </details>
    </>
  );
}
