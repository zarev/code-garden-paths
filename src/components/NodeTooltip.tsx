import type { FileNode } from "@/lib/graphProcessor";

interface Props {
  node: FileNode;
  x: number;
  y: number;
}

const CATEGORY_LABELS: Record<string, string> = {
  red: "🔴 Congestion Hotspot",
  orange: "🟠 Complexity Hub",
  blue: "🔵 External Boundary",
  purple: "🟣 Test Infrastructure",
  green: "🟢 Smooth Flow",
};

export default function NodeTooltip({ node, x, y }: Props) {
  return (
    <div
      className="fixed z-50 bg-card/95 backdrop-blur-md border border-border rounded-lg p-3 shadow-2xl pointer-events-none max-w-[280px]"
      style={{ left: x + 16, top: y - 10 }}
    >
      <div className="font-mono text-xs font-semibold text-foreground mb-1 truncate">
        {node.name}
      </div>
      <div className="text-[10px] text-muted-foreground mb-2 truncate">
        {node.fullPath}
      </div>
      
      <div className="text-[10px] mb-2" style={{ color: `hsl(var(--mm-${node.category}))` }}>
        {CATEGORY_LABELS[node.category]}
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] font-mono">
        <div className="text-muted-foreground">Fan-in</div>
        <div className="text-foreground">{node.fanIn}</div>
        <div className="text-muted-foreground">Fan-out</div>
        <div className="text-foreground">{node.fanOut}</div>
        <div className="text-muted-foreground">External deps</div>
        <div className="text-foreground">{node.externalImports}</div>
        <div className="text-muted-foreground">Functions</div>
        <div className="text-foreground">{node.functionCount}</div>
        <div className="text-muted-foreground">Classes</div>
        <div className="text-foreground">{node.classCount}</div>
        <div className="text-muted-foreground">Congestion</div>
        <div className="text-foreground">{(node.congestionScore * 100).toFixed(0)}%</div>
      </div>
    </div>
  );
}
