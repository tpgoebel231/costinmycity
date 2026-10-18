import { IconCircleCheck } from "@/components/ui/icons";

export function FeesCheckedBadge({ label, href }: { label: string; href: string }) {
  const external = href.startsWith("http");
  return (
    <a
      className="fee-badge"
      href={href}
      {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
    >
      <IconCircleCheck size={16} />
      <span>{label}</span>
    </a>
  );
}
