import { useQuery } from "@tanstack/react-query";
import { fetchGraph } from "../api/graph";

export function useGraphQuery() {
  return useQuery({
    queryKey: ["graph"],
    queryFn: fetchGraph,
    staleTime: Infinity,
  });
}
