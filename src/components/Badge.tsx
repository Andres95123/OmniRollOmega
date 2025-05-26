import "../../public/animations.css";
import "../../public/colors.css";

// Remove the comment defining the pulse animation and the inline animation styles.
// Apply the 'appear' animation once and the 'pulse' animation infinitely using the styles defined in popup.css.

export default function Badge({
  text,
  backgroundColor = "var(--primario-crunchyroll)", // Default to Crunchyroll primary color
  color = "#fff", // Default to white text
}: {
  text: string;
  backgroundColor?: string;
  color?: string;
}): JSX.Element {
  return (
    <span
      style={{
        backgroundColor: backgroundColor,
        color: color,
        padding: "4px 10px",
        display: "inline-block",
        borderRadius: "4px",
        fontWeight: "bold",
        // Apply animations defined in popup.css
        animation: "appear 0.5s ease-out forwards, pulse 1.5s infinite 0.5s", // Run appear once, then start pulse
        opacity: 0, // Start transparent for appear animation
        // No interaction styles
        pointerEvents: "none",
        userSelect: "none",
        cursor: "default",
        textAlign: "center",
      }}
    >
      {text}
    </span>
  );
}
