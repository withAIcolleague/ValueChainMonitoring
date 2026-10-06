import { useState } from "react";
import type { StockLink } from "@valuechain/shared";
import { addStockLink, removeStockLink } from "../../api/links";
import { useQueryClient } from "@tanstack/react-query";

interface ExternalLinksProps {
  stockId: number;
  links: StockLink[];
}

const QUICK_LABELS = ["네이버 증권", "토스", "Investing.com", "기업 IR"];

export function ExternalLinks({ stockId, links }: ExternalLinksProps) {
  const qc = useQueryClient();
  const [label, setLabel] = useState(QUICK_LABELS[0]);
  const [url, setUrl] = useState("");

  async function handleAdd() {
    if (!url) return;
    await addStockLink(stockId, { label, url });
    setUrl("");
    qc.invalidateQueries({ queryKey: ["stockLinks", stockId] });
  }

  async function handleRemove(linkId: number) {
    await removeStockLink(stockId, linkId);
    qc.invalidateQueries({ queryKey: ["stockLinks", stockId] });
  }

  return (
    <div className="external-links">
      <ul>
        {links.map((l) => (
          <li key={l.id}>
            <a href={l.url} target="_blank" rel="noreferrer">{l.label}</a>
            <button className="link-button" onClick={() => handleRemove(l.id)}>삭제</button>
          </li>
        ))}
      </ul>
      <div className="link-add-form">
        <select value={label} onChange={(e) => setLabel(e.target.value)}>
          {QUICK_LABELS.map((l) => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>
        <input
          type="url"
          placeholder="https://..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <button className="secondary-button" onClick={handleAdd}>추가</button>
      </div>
    </div>
  );
}
