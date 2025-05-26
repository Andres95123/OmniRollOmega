import Banderas from "./Banderas";
import { LanguageInfo } from "../interfaces/outputs";
import unknownFlag from "../../public/images/unknown.png";

export default function AnimeLangInfo({
  languages,
}: {
  readonly languages: LanguageInfo[];
}) {
  if (!languages || languages.length === 0) {
    return null; // No languages to display
  }

  return (
    <div
      style={{
        position: "fixed",
        zIndex: 9999,
        bottom: "8px",
        right: "8px",
        backgroundColor: "rgba(0, 0, 0, 0.6)",
        padding: "4px 8px",
        borderRadius: "4px",
        display: "flex",
        alignItems: "center",
        animation: "fadeIn 0.05s ease-out forwards",
        gap: "8px",
      }}
    >
      <Banderas
        codigosBandera={languages}
        animate={false}
        style={{
          display: "flex",
          gap: "4px",
        }}
      />
    </div>
  );
}
