import type { FileNode, ProcessedGraph } from "@/lib/graphProcessor";
import { X } from "lucide-react";

interface Props {
  node: FileNode;
  graph: ProcessedGraph;
  onClose: () => void;
}

export default function NodeDetail({ node, graph, onClose }: Props) {
  // Find connected nodes
  const incoming = graph.edges.filter(e => e.target === node.id);
  const outgoing = graph.edges.filter(e => e.source === node.id);
  const nodeMap = new Map(graph.nodes.map(n => [n.id, n]));

  return (
    <div className="absolute bottom-4 left-4 right-4 max-w-[500px] mx-auto bg-card/95 backdrop-blur-md border border-border rounded-lg shadow-2xl overflow-hidden">
      <div className="flex items-center justify-between p-3 border-b border-border">
        <div>
          <div className="font-mono text-sm font-semibold text-foreground">{node.name}</div>
          <div className="text-[10px] text-muted-foreground font-mono">{node.fullPath}</div>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1">
          <X size={14} />
        </button>
      </div>

      <div className="p-3 grid grid-cols-2 gap-4 text-xs font-mono">
        <div>
          <div className="text-muted-foreground mb-1 text-[10px] uppercase tracking-wider">Incoming ({incoming.length})</div>
          <div className="space-y-0.5 max-h-[100px] overflow-y-auto">
            {incoming.slice(0, 10).map(e => {
              const src = nodeMap.get(e.source);
              return src ? (
                <div key={e.source} className="text-foreground truncate text-[11px]">
                  ← {src.name} <span className="text-muted-foreground">({e.callCount}c)</span>
                </div>
              ) : null;
            })}
            {incoming.length > 10 && <div className="text-muted-foreground">+{incoming.length - 10} more</div>}
          </div>
        </div>
        <div>
          <div className="text-muted-foreground mb-1 text-[10px] uppercase tracking-wider">Outgoing ({outgoing.length})</div>
          <div className="space-y-0.5 max-h-[100px] overflow-y-auto">
            {outgoing.slice(0, 10).map(e => {
              const tgt = nodeMap.get(e.target);
              return tgt ? (
                <div key={e.target} className="text-foreground truncate text-[11px]">
                  → {tgt.name} <span className="text-muted-foreground">({e.callCount}c)</span>
                </div>
              ) : null;
            })}
            {outgoing.length > 10 && <div className="text-muted-foreground">+{outgoing.length - 10} more</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
