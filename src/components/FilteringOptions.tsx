// src/components/FilteringOptions.tsx
import React, {
  useState,
  useEffect,
  ChangeEvent,
  CSSProperties,
  useRef,
} from "react";
import { getLanguages, Language } from "../utils/server";
import { FilterElement } from "../scripts/filtering";
import "../../public/animations.css";

export type FilterOptions = {
  dubCode?: string;
  subCode?: string;
  isNew?: boolean;
  score?: number;
  rating?: string;
  episodes?: number;
};

interface FilteringOptionsProps {
  filterElements: FilterElement[];
}

type FieldConfig =
  | {
      type: "select";
      name: keyof FilterOptions;
      label: string;
      options: Array<{ value: string; label: string }>;
    }
  | {
      type: "checkbox";
      name: keyof FilterOptions;
      label: string;
    }
  | {
      type: "number";
      name: "score" | "episodes"; // Specific keys for number type
      label: string;
      min?: number;
      step?: number;
    };

const COMMON_CONTROL_STYLE: CSSProperties = {
  color: "#fff",
  background: "#1a1c20",
  border: "1px solid #444",
  padding: "0.5rem",
  appearance: "none",
  width: "100%",
};

const BREAKPOINT = 768; // Pixels for switching to icon-only button

const FilteringOptions: React.FC<FilteringOptionsProps> = ({
  filterElements,
}) => {
  const [open, setOpen] = useState(false);
  const [listLanguages, setListLanguages] = useState<Language[]>([]);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    dubCode: "all",
    subCode: "all",
    isNew: false,
    score: undefined, // Changed from 0 to undefined to indicate "no filter"
    rating: "all",
    episodes: undefined, // Changed from 0 to undefined to indicate "no filter"
  });

  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isSmallScreen, setIsSmallScreen] = useState(
    window.innerWidth < BREAKPOINT
  );
  const [isButtonHovered, setIsButtonHovered] = useState(false);
  const [dropdownVisible, setDropdownVisible] = useState(false); // For dropdown opacity transition

  useEffect(() => {
    getLanguages().then(setListLanguages);
  }, []);

  useEffect(() => {
    filterElements.forEach((el) => {
      el.showIf(filterOptions);
    });
  }, [filterOptions, filterElements]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    // Add resize listener
    const handleResize = () => {
      setIsSmallScreen(window.innerWidth < BREAKPOINT);
    };

    window.addEventListener("resize", handleResize);
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      // Trigger fade-in for dropdown
      const timer = setTimeout(() => setDropdownVisible(true), 10); // Small delay for transition
      return () => {
        clearTimeout(timer);
        document.removeEventListener("mousedown", handleClickOutside); // Ensure removal here too
        window.removeEventListener("resize", handleResize); // Clean up resize listener
      };
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
      setDropdownVisible(false); // Trigger fade-out
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("resize", handleResize); // Clean up resize listener
    };
  }, [open]);

  const fields: FieldConfig[] = [
    {
      type: "select",
      name: "dubCode",
      label: "Dubs",
      options: [
        { value: "all", label: "All" },
        ...listLanguages.map((l) => ({ value: l.Code, label: l.Name })),
      ],
    },
    {
      type: "select",
      name: "subCode",
      label: "Subtitles",
      options: [
        { value: "all", label: "All" },
        ...listLanguages.map((l) => ({ value: l.Code, label: l.Name })),
      ],
    },
    {
      type: "select",
      name: "rating",
      label: "Rating",
      options: [
        { value: "all", label: "All" },
        { value: "pg", label: "PG" },
        { value: "12", label: "+12" },
        { value: "14", label: "+14" },
        { value: "16", label: "+16" },
        { value: "18", label: "+18" },
      ],
    },
    {
      type: "number",
      name: "score",
      label: "Minimum Score",
      min: 0,
      step: 0.1,
    },
    {
      type: "number",
      name: "episodes",
      label: "Minimum Episodes",
      min: 0,
      step: 1,
    },

    {
      type: "checkbox",
      name: "isNew",
      label: "Only news",
    },
  ];
  const handleChange =
    (name: keyof FilterOptions) =>
    (
      e: ChangeEvent<HTMLSelectElement> | ChangeEvent<HTMLInputElement>
    ): void => {
      const target = e.target;
      let value: string | number | boolean | undefined;

      if (target.type === "checkbox") {
        value = (target as HTMLInputElement).checked;
      } else if (target.type === "number") {
        const numValue = parseFloat(target.value);
        // Store undefined if input is empty, or the number if valid
        value =
          target.value === ""
            ? undefined
            : isNaN(numValue)
            ? undefined
            : numValue;
      } else {
        value = target.value;
      }
      setFilterOptions((f) => ({ ...f, [name]: value }));
    };

  const buttonStyle: CSSProperties = {
    padding: isSmallScreen ? "0.5rem 0.75rem" : "0.5rem 1rem",
    cursor: "pointer",
    background: isButtonHovered ? "#33353a" : "transparent",
    color: "#a0a0a0",
    border: "none",
    textTransform: "uppercase",
    fontWeight: "bold",
    fontSize: isSmallScreen ? "1.2rem" : "0.9rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: isSmallScreen ? "40px" : "auto",
    height: "40px",
    animation: "fadeIn 0.1s ease-in-out",
  };

  return (
    <div
      ref={dropdownRef}
      style={{ position: "relative", display: "inline-block", color: "#fff" }}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={buttonStyle}
        onMouseEnter={() => setIsButtonHovered(true)}
        onMouseLeave={() => setIsButtonHovered(false)}
      >
        {isSmallScreen ? "▼" : "▼ OMNIFILTERS"}
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            marginTop: 4,
            background: "#23252b",
            border: "none",
            boxShadow: "0 2px 8px rgba(0,0,0,0.5)",
            padding: "1rem",
            display: "flex",
            flexDirection: "column",
            zIndex: 10,
            minWidth: 240,
            color: "#a0a0a0",
            opacity: dropdownVisible ? 1 : 0, // Controlled by state for transition
            transition: "opacity 0.08s ease-in-out", // Added: for pure fade effect
            visibility: dropdownVisible ? "visible" : "hidden", // Helps with accessibility and interaction
          }}
        >
          {fields.map((f) => (
            <div key={String(f.name)} style={{ marginBottom: "1rem" }}>
              {f.type === "select" ? (
                <>
                  <div
                    style={{
                      fontWeight: "bold",
                      color: "#fff",
                      marginBottom: "0.5rem",
                      fontSize: "1rem",
                    }}
                  >
                    {f.label}
                  </div>
                  <select
                    value={(filterOptions[f.name] as string) ?? ""}
                    onChange={handleChange(f.name)}
                    style={{ ...COMMON_CONTROL_STYLE, marginTop: "0.25rem" }}
                  >
                    {f.options.map((opt) => (
                      <option
                        key={opt.value}
                        value={opt.value}
                        style={{ background: "#1a1c20", color: "#fff" }}
                      >
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </>
              ) : f.type === "checkbox" ? (
                <label
                  style={{
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={Boolean(filterOptions[f.name])}
                    onChange={handleChange(f.name)}
                    style={{
                      marginRight: "0.5rem",
                      accentColor: "#f47521",
                      width: "16px",
                      height: "16px",
                    }}
                  />
                  <span
                    style={{
                      color: "#fff",
                      fontWeight: "bold",
                      fontSize: "1rem",
                    }}
                  >
                    {f.label}
                  </span>
                </label>
              ) : f.type === "number" ? (
                <>
                  <div
                    style={{
                      fontWeight: "bold",
                      color: "#fff",
                      marginBottom: "0.5rem",
                      fontSize: "1rem",
                    }}
                  >
                    {f.label}
                  </div>
                  <input
                    type="number"
                    name={f.name}
                    value={filterOptions[f.name] ?? ""} // Show empty string if undefined, or the number
                    onChange={handleChange(f.name)}
                    min={f.min}
                    step={f.step}
                    style={{ ...COMMON_CONTROL_STYLE, marginTop: "0.25rem" }}
                  />
                </>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FilteringOptions;
