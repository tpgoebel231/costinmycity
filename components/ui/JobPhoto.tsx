import credits from "@/data/image-credits.json";

type Credit = (typeof credits.images)[number];

export function JobPhoto({ id, priority = false }: { id: string; priority?: boolean }) {
  const image = credits.images.find((item) => item.id === id) as Credit | undefined;
  if (!image) return null;
  const line = image.author === image.source ? "Photo: " + image.source : "Photo: " + image.author + " / " + image.source;
  return (
    <figure className={id === "home" ? "home-photo" : "job-photo"}>
      <picture>
        <source srcSet={image.avif} type="image/avif" />
        <img
          src={image.file}
          alt={image.alt}
          width={image.width}
          height={image.height}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "low"}
          decoding="async"
        />
      </picture>
      <figcaption>
        <a href={image.sourceUrl} target="_blank" rel="noreferrer">
          {line}
        </a>
      </figcaption>
    </figure>
  );
}
