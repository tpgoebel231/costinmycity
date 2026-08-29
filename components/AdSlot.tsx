export function AdSlot({ placement }: { placement: "inline" | "sidebar" }) {
  const size = placement === "sidebar"
    ? "min-h-[250px] w-full max-w-[300px]"
    : "min-h-[90px] w-full max-w-[336px]";
  return (
    <aside aria-label="Advertisement" className={"border border-dashed border-line bg-ad p-3 " + size}>
      <p className="text-[11px] uppercase tracking-wider text-muted">Advertisement</p>
      <div className="mt-2 h-full min-h-[60px]" />
    </aside>
  );
}
