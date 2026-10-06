import { useEffect, useRef, useState } from "react";
import { useGraphStore } from "../../graph/graphStore";

export function SearchBar() {
  const setSearchQuery = useGraphStore((s) => s.setSearchQuery);
  const [value, setValue] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setSearchQuery(value), 180);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [value, setSearchQuery]);

  return (
    <input
      type="text"
      placeholder="종목명 또는 티커 검색"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      className="search-input"
    />
  );
}
