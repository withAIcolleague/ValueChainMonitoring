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
