import type Graph from "graphology";
import FA2Layout from "graphology-layout-forceatlas2/worker";
import forceAtlas2 from "graphology-layout-forceatlas2";

const AUTO_STOP_MS = 5000;

export interface RunLayoutOptions {
  onTick?: () => void;
  onDone?: () => void;
  durationMs?: number;
}

/** Runs ForceAtlas2 in a Web Worker so the main thread (and graph interactions) never blocks. */
export function runForceAtlas2InWorker(graph: Graph, options: RunLayoutOptions = {}): () => void {
  const sensibleSettings = forceAtlas2.inferSettings(graph);
  const layout = new FA2Layout(graph, { settings: sensibleSettings });

  layout.start();

  // The supervisor mutates node x/y attributes on the graph as worker ticks arrive,
  // but does not emit its own event; poll so sigma can repaint progressively.
  const pollInterval = options.onTick ? setInterval(options.onTick, 120) : null;

  const timer = setTimeout(() => {
    if (pollInterval) clearInterval(pollInterval);
    layout.stop();
    layout.kill?.();
    options.onDone?.();
  }, options.durationMs ?? AUTO_STOP_MS);

  return () => {
    if (pollInterval) clearInterval(pollInterval);
    clearTimeout(timer);
    layout.stop();
    layout.kill?.();
  };
}
