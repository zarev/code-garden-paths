import { ScrollArea } from "@/components/ui/scroll-area";

interface Props {
  packages: string[];
  selectedPackage: string | null;
  onSelect: (pkg: string | null) => void;
  nodeCounts: Map<string, number>;
  congestionScores: Map<string, number>;
}

function getCongestionColor(score: number): string {
  if (score >= 0.65) return "hsl(0, 70%, 50%)";    // red
  if (score >= 0.35) return "hsl(45, 90%, 50%)";   // yellow
  return "hsl(140, 55%, 42%)";                       // green
}

export default function PackageSelector({ packages, selectedPackage, onSelect, nodeCounts, congestionScores }: Props) {
  return (
    <div className="absolute top-4 right-4 bg-card/90 backdrop-blur-sm rounded-lg border border-border shadow-xl w-[220px]">
      <div className="p-3 border-b border-border">
        <h3 className="font-mono text-xs font-semibold text-foreground tracking-wider uppercase">
          Neighborhoods
        </h3>
      </div>
      <ScrollArea className="h-[300px]">
        <div className="p-2 space-y-0.5">
          <button
            onClick={() => onSelect(null)}
            className={`w-full text-left px-2 py-1.5 rounded text-xs font-mono transition-all ${
              !selectedPackage ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
            }`}
          >
            All packages
          </button>
          {packages.map(pkg => {
            const score = congestionScores.get(pkg) ?? 0;
            const color = getCongestionColor(score);
            return (
              <button
                key={pkg}
                onClick={() => onSelect(pkg === selectedPackage ? null : pkg)}
                className={`w-full text-left px-2 py-1.5 rounded text-xs font-mono transition-all flex items-center gap-1.5 ${
                  pkg === selectedPackage ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                }`}
              >
                {/* Congestion bar */}
                <div className="flex-shrink-0 w-[3px] h-3.5 rounded-full opacity-80" style={{ backgroundColor: color }} />
                <span className="truncate flex-1">{pkg}</span>
                <span className="text-[10px] opacity-60 ml-1 flex-shrink-0">{nodeCounts.get(pkg) || 0}</span>
              </button>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
