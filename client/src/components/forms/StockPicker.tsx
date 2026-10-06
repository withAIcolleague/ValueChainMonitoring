import { useEffect, useState } from "react";
import type { GraphNode } from "@valuechain/shared";
import { Combobox } from "./Combobox";

interface StockPickerProps {
  id: string;
  nodes: GraphNode[];
  value: number | undefined;
  onChange: (stockId: number | undefined) => void;
  excludeId?: number;
}

function labelOf(n: GraphNode): string {
  return `${n.name} (${n.ticker})`;
}

export function StockPicker({ id, nodes, value, onChange, excludeId }: StockPickerProps) {
  const options = nodes.filter((n) => n.id !== excludeId);
  const [query, setQuery] = useState(() => {
    const selected = nodes.find((n) => n.id === value);
    return selected ? labelOf(selected) : "";
  });

  useEffect(() => {
    const selected = nodes.find((n) => n.id === value);
    setQuery(selected ? labelOf(selected) : "");
  }, [value, nodes]);

  return (
    <Combobox
      id={id}
      options={options.map((n) => ({ id: n.id, label: labelOf(n) }))}
      value={query}
      placeholder="종목명 또는 티커 입력"
      onInputChange={(text) => {
        setQuery(text);
        onChange(undefined);
      }}
      onSelect={(option) => {
        setQuery(option.label);
        onChange(option.id);
      }}
    />
  );
}
