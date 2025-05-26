import "../../public/animations.css";
import { LanguageInfo } from "../interfaces/outputs";

/**
 * Renders a list of country flags horizontally.
 */
export default function Banderas({
  codigosBandera,
  alt = "",
  title = "",
  flagSize = 24, // Default size for flags
  animate = true,
  style = {}, // Additional styles for the container
}: {
  /** Array of ISO 3166-1 alpha-2 country codes. */
  codigosBandera: LanguageInfo[];
  /** Base alt text for the images. The country code will be appended. */
  alt?: string;
  /** Base title text for the images. The country code will be appended. */
  title?: string;
  /** Size of the flags in pixels. Default is 24. */
  flagSize?: number; // Size of the flags in pixels
  /** Whether to animate the flags. Default is true. */
  animate?: boolean; // Whether to animate the flags
  /** Gap between flags in pixels. Default is 4. */
  /** Additional styles for the container. */
  style?: React.CSSProperties; // Additional styles for the container
}): JSX.Element {
  return (
    <div
      style={{
        display: "flex",
        ...style, // Spread additional styles
      }}
    >
      {codigosBandera.map((codigoBandera, index) => (
        <img
          key={`${codigoBandera.Flag}-${index}`}
          src={`https://flagsapi.com/${codigoBandera.Flag.toUpperCase()}/flat/${flagSize}.png`}
          style={{
            objectFit: "contain",
            animation: animate ? "appear 0.5s ease-out forwards" : "none",
            width: `${flagSize}px`, // Explicit width
            height: `${flagSize}px`, // Explicit height
          }}
          alt={`${alt} ${codigoBandera.Name}`}
          title={`${title} ${codigoBandera.Name}`}
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      ))}
    </div>
  );
}
