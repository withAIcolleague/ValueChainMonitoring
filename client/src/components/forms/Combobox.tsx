import { useEffect, useRef, useState } from "react";

export interface ComboboxOption {
  id: number;
  label: string;
}

interface ComboboxProps {
  id?: string;
  options: ComboboxOption[];
  value: string;
  onInputChange: (text: string) => void;
  onSelect: (option: ComboboxOption) => void;
  placeholder?: string;
}

/** Self-rendered autocomplete dropdown. Native <datalist> popups are drawn by the
 * browser outside the page DOM, so they don't reliably appear under automated/
 * synthetic input and are invisible to accessibility-tree inspection. */
export function Combobox({ id, options, value, onInputChange, onSelect, placeholder }: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = value.trim()
    ? options.filter((o) => o.label.toLowerCase().includes(value.trim().toLowerCase())).slice(0, 8)
    : options.slice(0, 8);

  function resolveMatch(): ComboboxOption | undefined {
    const normalized = value.trim().toLowerCase();
    if (!normalized) return undefined;
    return (
      filtered.find((o) => o.label.trim().toLowerCase() === normalized) ?? filtered[0]
    );
  }

  return (
    <div className="combobox" ref={containerRef}>
      <input
        id={id}
        value={value}
        placeholder={placeholder}
        onChange={(e) => {
          onInputChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            const match = resolveMatch();
            if (match) {
              e.preventDefault();
              onSelect(match);
              setOpen(false);
            }
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
        onBlur={() => {
          const normalized = value.trim().toLowerCase();
          const exact = normalized ? options.find((o) => o.label.trim().toLowerCase() === normalized) : undefined;
          if (exact) onSelect(exact);
          setOpen(false);
        }}
      />
      {open && filtered.length > 0 && (
        <ul className="combobox-list">
          {filtered.map((o) => (
            <li
              key={o.id}
              onMouseDown={(e) => {
                e.preventDefault();
                onSelect(o);
                setOpen(false);
              }}
            >
              {o.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
