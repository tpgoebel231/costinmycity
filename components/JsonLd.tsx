import { replaceEmDashes } from "@/lib/dashes";

export function JsonLd({ data }: { data: object | object[] }) {
  const items = Array.isArray(data) ? data : [data];
  return (
    <>
      {items.map((item, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: replaceEmDashes(JSON.stringify(item)) }}
        />
      ))}
    </>
  );
}
