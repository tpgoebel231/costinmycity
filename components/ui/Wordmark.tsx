import Link from "next/link";

export function Wordmark({ markId = "wm" }: { markId?: string }) {
  const mask = markId + "-pin";
  return (
    <Link href="/" className="wordmark">
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32" aria-hidden="true">
        <mask id={mask}>
          <path fill="#fff" d="M16 1.15C9.55 1.15 4.3 6.15 4.3 12.35 4.3 20.15 16 30.85 16 30.85s11.7-10.7 11.7-18.5C27.7 6.15 22.45 1.15 16 1.15z" />
          <text x="16" y="17" textAnchor="middle" fontFamily="Inter, system-ui, sans-serif" fontWeight="700" fontSize="13" fill="#000">$</text>
        </mask>
        <rect width="32" height="32" fill="#0F766E" mask={"url(#" + mask + ")"} />
      </svg>
      <span className="wordmark-text">
        Cost<b>InMy</b>City
      </span>
    </Link>
  );
}
