import type { ReactNode } from "react";

export function IconCard({
  icon,
  label,
  amount,
  note,
}: {
  icon: ReactNode;
  label: string;
  amount: string;
  note: string;
}) {
  return (
    <article className="card">
      <span className="icon-bubble">{icon}</span>
      <h3 className="mt-3">{label}</h3>
      <p className="num icon-amt">{amount}</p>
      <p className="icon-note">{note}</p>
    </article>
  );
}
