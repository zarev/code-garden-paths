import type { NodeCategory } from "@/lib/graphProcessor";

interface Props {
  visibleCategories: Set<NodeCategory>;
  toggleCategory: (cat: NodeCategory) => void;
  stats: {
    totalFiles: number;
    totalEdges: number;
    totalCalls: number;
  } | null;
}

const CATEGORIES: { key: NodeCategory; label: string; desc: string }[] = [
  { key: "red", label: "Congestion", desc: "High fan-in bottlenecks" },
  { key: "orange", label: "Complexity", desc: "High fan-in + fan-out hubs" },
  { key: "blue", label: "External", desc: "Heavy external dependencies" },
  { key: "purple", label: "Test/Harness", desc: "Test infrastructure" },
  { key: "green", label: "Smooth", desc: "Well-contained modules" },
];

export default function Legend({ visibleCategories, toggleCategory, stats }: Props) {
  return (
    <div className="absolute top-4 left-4 bg-card/90 backdrop-blur-sm rounded-lg p-4 border border-border shadow-xl max-w-[220px]">
      <h3 className="font-mono text-xs font-semibold text-foreground mb-3 tracking-wider uppercase">
        Traffic Map
      </h3>
      
      <div className="space-y-1.5">
        {CATEGORIES.map(cat => (
          <button
            key={cat.key}
            onClick={() => toggleCategory(cat.key)}
            className={`flex items-center gap-2 w-full text-left p-1.5 rounded transition-all ${
              visibleCategories.has(cat.key) ? "opacity-100" : "opacity-30"
            } hover:bg-secondary/50`}
          >
            <div
              className="w-3 h-3 rounded-sm flex-shrink-0"
              style={{ backgroundColor: `hsl(var(--mm-${cat.key}))` }}
            />
            <div className="min-w-0">
              <div className="text-xs font-medium text-foreground">{cat.label}</div>
              <div className="text-[10px] text-muted-foreground leading-tight">{cat.desc}</div>
            </div>
          </button>
        ))}
      </div>

      {stats && (
        <div className="mt-3 pt-3 border-t border-border space-y-1">
          <div className="text-[10px] text-muted-foreground font-mono">
            {stats.totalFiles} files · {stats.totalEdges} connections
          </div>
          <div className="text-[10px] text-muted-foreground font-mono">
            {stats.totalCalls} cross-file calls
          </div>
        </div>
      )}
    </div>
  );
}
