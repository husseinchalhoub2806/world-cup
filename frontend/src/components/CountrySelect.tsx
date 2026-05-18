import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { COUNTRIES } from "../constants/countries";

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  exclude?: string;
}

export default function CountrySelect({
  value,
  onChange,
  placeholder = "Select country...",
  exclude,
}: Props) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selected = COUNTRIES.find((c) => c.name === value);

  const filtered = COUNTRIES.filter(
    (c) =>
      c.name !== exclude &&
      c.name.toLowerCase().includes(filter.toLowerCase())
  );

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setFilter("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 10);
  }, [open]);

  const select = (name: string) => {
    onChange(name);
    setOpen(false);
    setFilter("");
  };

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="input flex items-center justify-between gap-2 text-left cursor-pointer"
        style={{ borderColor: open ? "rgba(34,197,94,0.5)" : undefined }}
      >
        {selected ? (
          <span className="flex items-center gap-2">
            <span style={{ fontSize: "1.2rem", lineHeight: 1 }}>{selected.flag}</span>
            <span className="text-gray-100">{selected.name}</span>
          </span>
        ) : (
          <span className="text-gray-600">{placeholder}</span>
        )}
        <ChevronDown
          size={16}
          className="shrink-0 text-gray-500 transition-transform duration-200"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            right: 0,
            zIndex: 200,
            background: "rgba(4, 14, 6, 0.97)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            border: "1px solid rgba(34,197,94,0.3)",
            borderRadius: "12px",
            overflow: "hidden",
            boxShadow: "0 12px 40px rgba(0,0,0,0.7), 0 0 0 1px rgba(34,197,94,0.05)",
          }}
        >
          {/* Search */}
          <div
            style={{
              padding: "8px 8px 6px",
              borderBottom: "1px solid rgba(34,197,94,0.12)",
            }}
          >
            <input
              ref={searchRef}
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Search country..."
              className="input"
              style={{ padding: "7px 12px", fontSize: "0.85rem" }}
            />
          </div>

          {/* List */}
          <div style={{ maxHeight: "240px", overflowY: "auto" }}>
            {filtered.length === 0 ? (
              <div
                style={{
                  padding: "14px",
                  textAlign: "center",
                  color: "#4b5563",
                  fontSize: "0.875rem",
                }}
              >
                No countries found
              </div>
            ) : (
              filtered.map((c) => {
                const isSelected = c.name === value;
                return (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => select(c.name)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      width: "100%",
                      textAlign: "left",
                      padding: "8px 14px",
                      fontSize: "0.875rem",
                      color: isSelected ? "#4ade80" : "#d1d5db",
                      background: isSelected ? "rgba(34,197,94,0.12)" : "transparent",
                      cursor: "pointer",
                      border: "none",
                      fontWeight: isSelected ? 700 : 400,
                      transition: "background 0.1s",
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected)
                        (e.currentTarget as HTMLButtonElement).style.background =
                          "rgba(34,197,94,0.07)";
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected)
                        (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                    }}
                  >
                    <span style={{ fontSize: "1.15rem", lineHeight: 1, flexShrink: 0 }}>
                      {c.flag}
                    </span>
                    {c.name}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
