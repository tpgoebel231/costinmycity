import credits from "@/data/image-credits.json";

type Credit = (typeof credits.images)[number];

const WIDTHS = [640, 960, 1200];

function variant(url: string, width: number, full: number) {
  if (width === full) return url;
  return url.replace(/\.([a-z0-9]+)$/i, "-" + width + ".$1");
}

function srcSet(url: string, full: number) {
  return WIDTHS.map((width) => variant(url, width, full) + " " + width + "w").join(", ");
}

export function JobPhoto({
  id,
  priority = false,
  sizes = "(max-width: 899px) 360px, 40vw",
}: {
  id: string;
  priority?: boolean;
  sizes?: string;
}) {
  const image = credits.images.find((item) => item.id === id) as Credit | undefined;
  if (!image) return null;
  const line = image.author === image.source ? "Photo: " + image.source : "Photo: " + image.author + " / " + image.source;
  return (
    <figure className={id === "home" ? "home-photo" : "job-photo"}>
      <picture>
        <source type="image/avif" srcSet={srcSet(image.avif, image.width)} sizes={sizes} />
        <source type="image/webp" srcSet={srcSet(image.file, image.width)} sizes={sizes} />
        <img
          src={image.file}
          alt={image.alt}
          width={image.width}
          height={image.height}
          sizes={sizes}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "low"}
          decoding={priority ? "sync" : "async"}
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
