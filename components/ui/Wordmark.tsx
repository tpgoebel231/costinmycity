import Link from "next/link";

export function Wordmark() {
  return (
    <Link href="/" className="wordmark">
      <img src="/icon-192.png" width={32} height={32} alt="" />
      <span className="wordmark-text">
        Cost<b>InMy</b>City
      </span>
    </Link>
  );
}
