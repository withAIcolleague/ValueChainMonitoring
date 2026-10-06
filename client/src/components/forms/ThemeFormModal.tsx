import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { addStockTheme, createTheme } from "../../api/themes";
import { useInvalidateGraph, useThemesQuery } from "../../hooks/queries";
import { Modal } from "./Modal";
import { Combobox } from "./Combobox";

interface ThemeFormModalProps {
  stockId: number;
  onClose: () => void;
}

export function ThemeFormModal({ stockId, onClose }: ThemeFormModalProps) {
  const qc = useQueryClient();
  const invalidateGraph = useInvalidateGraph();
  const { data: themes = [] } = useThemesQuery();

  const [themeName, setThemeName] = useState("");
  const [color, setColor] = useState("#2563eb");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!themeName.trim()) return;
    setSubmitting(true);
    try {
      const existing = themes.find((t) => t.name === themeName.trim());
      const theme = existing ?? (await createTheme({ name: themeName.trim(), color }));
      await addStockTheme(stockId, theme.id);
      qc.invalidateQueries({ queryKey: ["stockThemeIds", stockId] });
      qc.invalidateQueries({ queryKey: ["themes"] });
      invalidateGraph();
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal title="테마 추가" onClose={onClose}>
      <form onSubmit={handleSubmit} className="entity-form">
        <label>
          테마명
          <Combobox
            id="theme-name"
            options={themes.map((t) => ({ id: t.id, label: t.name }))}
            value={themeName}
            onInputChange={setThemeName}
            onSelect={(option) => setThemeName(option.label)}
            placeholder="테마명 입력 (새 테마는 자동 등록)"
          />
        </label>
        <label>
          색상 (신규 테마인 경우)
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
        </label>
        <button type="submit" disabled={submitting} className="primary-button">추가</button>
      </form>
    </Modal>
  );
}
