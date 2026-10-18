import credits from "@/data/image-credits.json";
import type { CityHeroImage } from "@/lib/types";

const WIDTHS = [480, 640, 720, 960, 1440];
const SIZES = "(min-width: 800px) 42vw, calc(100vw - 32px)";

function srcSet(file: string, type: "avif" | "webp") {
  return WIDTHS.map((width) => "/img/cities/" + file + "-" + width + "." + type + " " + width + "w").join(", ");
}

/**
 * City skyline only. Never a house photo standing in for a city.
 * fetchPriority is high only when the caller has decided this image is the LCP.
 */
export function CityHeroPhoto({
  image,
  priority,
}: {
  image: CityHeroImage;
  priority: boolean;
}) {
  const meta = credits.images.find((item) => item.id === image.file);
  const width = meta?.width ?? 1440;
  const height = meta?.height ?? 960;
  return (
    <figure className="city-hero-photo">
      {priority ? (
        <link
          rel="preload"
          as="image"
          type="image/avif"
          href={"/img/cities/" + image.file + "-480.avif"}
          imageSrcSet={srcSet(image.file, "avif")}
          imageSizes={SIZES}
          fetchPriority="high"
        />
      ) : null}
      <picture>
        <source type="image/avif" srcSet={srcSet(image.file, "avif")} sizes={SIZES} />
        <source type="image/webp" srcSet={srcSet(image.file, "webp")} sizes={SIZES} />
        <img
          src={"/img/cities/" + image.file + "-1440.webp"}
          alt={image.alt}
          width={width}
          height={height}
          sizes={SIZES}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "low"}
          decoding={priority ? "sync" : "async"}
        />
      </picture>
      <figcaption>
        {"Photo: " + image.credit + " / "}
        <a href={image.sourceUrl} target="_blank" rel="noreferrer">Wikimedia Commons</a>
        {", "}
        <a href={image.licenseUrl} target="_blank" rel="noreferrer">{image.license}</a>
      </figcaption>
    </figure>
  );
}