import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import Graph from "graphology";
import Sigma from "sigma";
import type { EdgeDisplayData, NodeDisplayData } from "sigma/types";
import type { GraphPayload, RelationTypeDef } from "@valuechain/shared";
import { useGraphStore } from "./graphStore";
import { runForceAtlas2InWorker } from "./layoutWorker";
import { saveLayoutPositions } from "../api/graph";
import {
  DEFAULT_NODE_COLOR,
  DOWNSTREAM_COLOR,
  FADED_COLOR,
  NEWS_BORDER_COLOR,
  SELECTED_COLOR,
  UPSTREAM_COLOR,
  computeMaxDegree,
  nodeSizeFromDegree,
} from "./sigmaSetup";

export interface GraphCanvasHandle {
  recomputeLayout: () => void;
  zoomToFit: () => void;
  selectNode: (id: number) => void;
}

interface GraphCanvasProps {
  payload: GraphPayload;
}

function relationColorMap(relationTypes: RelationTypeDef[]): Map<number, RelationTypeDef> {
  return new Map(relationTypes.map((rt) => [rt.id, rt]));
}

interface FilterState {
  searchQuery: string;
  sectorFilter: string | null;
  marketFilter: string | null;
  themeFilter: number | null;
  businessTypeFilter: "B2G" | "B2B" | "B2C" | null;
}

function nodeMatchesFilters(raw: GraphPayload["nodes"][number], state: FilterState): boolean {
  const matchesSearch =
    !state.searchQuery ||
    raw.name.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
    raw.ticker.toLowerCase().includes(state.searchQuery.toLowerCase());
  const matchesSector = !state.sectorFilter || raw.sector === state.sectorFilter;
  const matchesMarket = !state.marketFilter || raw.market === state.marketFilter;
  const matchesTheme = !state.themeFilter || raw.themeIds.includes(state.themeFilter);
  const matchesBiz = !state.businessTypeFilter || raw.businessTypes.includes(state.businessTypeFilter);
  return matchesSearch && matchesSector && matchesMarket && matchesTheme && matchesBiz;
}

function isAnyFilterActive(state: FilterState): boolean {
  return !!(
    state.searchQuery ||
    state.sectorFilter ||
    state.marketFilter ||
    state.themeFilter ||
    state.businessTypeFilter
  );
}

function computeEgoNetwork(graph: Graph, nodeKey: string, depth: number) {
  const upstream = new Set<number>();
  const downstream = new Set<number>();

  const visitedUp = new Set<string>([nodeKey]);
  let frontier = [nodeKey];
  for (let d = 0; d < depth; d++) {
    const next: string[] = [];
    for (const n of frontier) {
      for (const inNeighbor of graph.inNeighbors(n)) {
        if (!visitedUp.has(inNeighbor)) {
          visitedUp.add(inNeighbor);
          upstream.add(Number(inNeighbor));
          next.push(inNeighbor);
        }
      }
    }
    frontier = next;
  }

  const visitedDown = new Set<string>([nodeKey]);
  frontier = [nodeKey];
  for (let d = 0; d < depth; d++) {
    const next: string[] = [];
    for (const n of frontier) {
      for (const outNeighbor of graph.outNeighbors(n)) {
        if (!visitedDown.has(outNeighbor)) {
          visitedDown.add(outNeighbor);
          downstream.add(Number(outNeighbor));
          next.push(outNeighbor);
        }
      }
    }
    frontier = next;
  }

  const directions = new Map<number, "upstream" | "downstream">();
  upstream.forEach((n) => directions.set(n, "upstream"));
  downstream.forEach((n) => directions.set(n, "downstream"));
  const highlighted = new Set<number>([Number(nodeKey), ...upstream, ...downstream]);
  return { highlighted, directions };
}

export const GraphCanvas = forwardRef<GraphCanvasHandle, GraphCanvasProps>(({ payload }, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sigmaRef = useRef<Sigma | null>(null);
  const graphRef = useRef<Graph | null>(null);
  const stopLayoutRef = useRef<(() => void) | null>(null);
  const lastHighlightRef = useRef<{ id: number | null; depth: number }>({ id: null, depth: 0 });

  useImperativeHandle(ref, () => ({
    recomputeLayout: () => {
      const graph = graphRef.current;
      if (!graph) return;
      stopLayoutRef.current?.();
      stopLayoutRef.current = runForceAtlas2InWorker(graph, {
        onTick: () => sigmaRef.current?.refresh(),
        onDone: () => persistPositions(graph),
      });
    },
    zoomToFit: () => {
      sigmaRef.current?.getCamera().animatedReset();
    },
    selectNode: (id: number) => {
      const graph = graphRef.current;
      const sigma = sigmaRef.current;
      if (!graph || !sigma || !graph.hasNode(String(id))) return;
      const depth = useGraphStore.getState().highlightDepth;
      const { highlighted, directions } = computeEgoNetwork(graph, String(id), depth);
      useGraphStore.getState().setSelectedStock(id);
      useGraphStore.getState().setHighlight(highlighted, directions);
      const pos = sigma.getNodeDisplayData(String(id));
      if (pos) {
        sigma.getCamera().animate({ x: pos.x, y: pos.y, ratio: 0.15 }, { duration: 400 });
      }
      sigma.refresh();
    },
  }));

  function persistPositions(graph: Graph) {
    const positions = graph.mapNodes((key, attrs) => ({
      stockId: Number(key),
      x: attrs.x as number,
      y: attrs.y as number,
    }));
    saveLayoutPositions(positions).catch((err) => console.error("layout save failed", err));
  }

  useEffect(() => {
    if (!containerRef.current) return;

    const graph = new Graph({ type: "mixed", multi: true });
    const relTypes = relationColorMap(payload.relationTypes);
    const maxDegree = computeMaxDegree(payload.nodes);

    for (const node of payload.nodes) {
      graph.addNode(String(node.id), {
        x: node.x,
        y: node.y,
        size: nodeSizeFromDegree(node.degree, maxDegree),
        label: `${node.name} (${node.ticker})`,
        color: DEFAULT_NODE_COLOR,
        raw: node,
      });
    }

    for (const edge of payload.edges) {
      const rt = relTypes.get(edge.relationTypeId);
      try {
        graph.addEdgeWithKey(String(edge.id), String(edge.source), String(edge.target), {
          type: rt?.directionality === "undirected" ? "line" : "arrow",
          size: Math.min(4, 0.8 + edge.weight / 3),
          color: rt?.color ?? "#94a3b8",
          raw: edge,
        });
      } catch {
        // duplicate edge key guard, ignore
      }
    }

    graphRef.current = graph;

    const sigma = new Sigma(graph, containerRef.current, {
      defaultNodeType: "circle",
      defaultEdgeType: "arrow",
      renderEdgeLabels: false,
      labelRenderedSizeThreshold: 6,
      labelDensity: 0.7,
      zIndex: true,
    });
    sigmaRef.current = sigma;

    sigma.setSetting("nodeReducer", (node, data) => {
      const state = useGraphStore.getState();
      const res: Partial<NodeDisplayData> = { ...data };
      const raw = data.raw as GraphPayload["nodes"][number];
      const numId = Number(node);

      const matchesFilters = nodeMatchesFilters(raw, state);
      const anyFilterActive = isAnyFilterActive(state);

      if (state.selectedStockId === numId) {
        res.color = SELECTED_COLOR;
        res.zIndex = 3;
      } else if (state.highlightedNodeIds.size > 0) {
        const dir = state.highlightDirectionByNode.get(numId);
        if (dir === "upstream") {
          res.color = UPSTREAM_COLOR;
          res.zIndex = 2;
        } else if (dir === "downstream") {
          res.color = DOWNSTREAM_COLOR;
          res.zIndex = 2;
        } else {
          res.hidden = true;
        }
      } else if (anyFilterActive && !matchesFilters) {
        res.hidden = true;
      } else if (state.showThemeColors && raw.themeIds.length > 0) {
        const theme = payload.themes.find((t) => t.id === raw.themeIds[0]);
        res.color = theme?.color ?? DEFAULT_NODE_COLOR;
      } else if (raw.latestNewsCategory && NEWS_BORDER_COLOR[raw.latestNewsCategory]) {
        res.color = NEWS_BORDER_COLOR[raw.latestNewsCategory] as string;
      } else {
        res.color = DEFAULT_NODE_COLOR;
      }

      return res as NodeDisplayData;
    });

    sigma.setSetting("edgeReducer", (edge, data) => {
      const state = useGraphStore.getState();
      const res: Partial<EdgeDisplayData> = { ...data };
      const [source, target] = graph.extremities(edge).map(Number);

      if (state.highlightedNodeIds.size > 0) {
        const sourceSelected = state.selectedStockId === source;
        const targetSelected = state.selectedStockId === target;
        const bothHighlighted = state.highlightedNodeIds.has(source) && state.highlightedNodeIds.has(target);
        if ((sourceSelected || targetSelected) && bothHighlighted) {
          res.color = state.highlightDirectionByNode.get(sourceSelected ? target : source) === "upstream"
            ? UPSTREAM_COLOR
            : DOWNSTREAM_COLOR;
          res.hidden = false;
          res.size = 2.5;
        } else {
          res.color = FADED_COLOR;
          res.hidden = true;
        }
      } else if (isAnyFilterActive(state)) {
        const sourceRaw = graph.getNodeAttribute(String(source), "raw") as GraphPayload["nodes"][number];
        const targetRaw = graph.getNodeAttribute(String(target), "raw") as GraphPayload["nodes"][number];
        res.hidden = !nodeMatchesFilters(sourceRaw, state) || !nodeMatchesFilters(targetRaw, state);
      } else {
        res.hidden = false;
      }
      return res as EdgeDisplayData;
    });

    sigma.on("clickNode", ({ node }) => {
      const id = Number(node);
      const depth = useGraphStore.getState().highlightDepth;
      const { highlighted, directions } = computeEgoNetwork(graph, node, depth);

      useGraphStore.getState().setSelectedStock(id);
      useGraphStore.getState().setHighlight(highlighted, directions);
      sigma.refresh();
    });

    sigma.on("clickStage", () => {
      useGraphStore.getState().setSelectedStock(null);
      useGraphStore.getState().clearHighlight();
      sigma.refresh();
    });

    sigma.on("enterNode", ({ node }) => useGraphStore.getState().setHoveredStock(Number(node)));
    sigma.on("leaveNode", () => useGraphStore.getState().setHoveredStock(null));

    const unsubscribe = useGraphStore.subscribe(() => sigma.refresh());

    // Recompute the ego-network when the selected node or the connection-depth slider changes,
    // so adjusting depth updates the already-selected node's highlighted/visible set live.
    const unsubscribeDepth = useGraphStore.subscribe((state) => {
      const { selectedStockId, highlightDepth } = state;
      if (selectedStockId === null) {
        lastHighlightRef.current = { id: null, depth: highlightDepth };
        return;
      }
      if (
        lastHighlightRef.current.id === selectedStockId &&
        lastHighlightRef.current.depth === highlightDepth
      ) {
        return;
      }
      lastHighlightRef.current = { id: selectedStockId, depth: highlightDepth };
      if (!graph.hasNode(String(selectedStockId))) return;
      const { highlighted, directions } = computeEgoNetwork(graph, String(selectedStockId), highlightDepth);
      useGraphStore.getState().setHighlight(highlighted, directions);
    });

    // If coordinates are freshly placeholder-circle (no persisted ForceAtlas2 run yet), refine in background.
    stopLayoutRef.current = runForceAtlas2InWorker(graph, {
      onTick: () => sigma.refresh(),
      onDone: () => persistPositions(graph),
    });

    return () => {
      unsubscribe();
      unsubscribeDepth();
      stopLayoutRef.current?.();
      sigma.kill();
      sigmaRef.current = null;
      graphRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payload]);

  return <div ref={containerRef} style={{ width: "100%", height: "100%" }} />;
});

GraphCanvas.displayName = "GraphCanvas";
