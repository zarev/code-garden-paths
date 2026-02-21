import { ScrollArea } from "@/components/ui/scroll-area";

interface Props {
  packages: string[];
  selectedPackage: string | null;
  onSelect: (pkg: string | null) => void;
  nodeCounts: Map<string, number>;
}

export default function PackageSelector({ packages, selectedPackage, onSelect, nodeCounts }: Props) {
  return (
    <div className="absolute top-4 right-4 bg-card/90 backdrop-blur-sm rounded-lg border border-border shadow-xl w-[200px]">
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
          {packages.map(pkg => (
            <button
              key={pkg}
              onClick={() => onSelect(pkg === selectedPackage ? null : pkg)}
              className={`w-full text-left px-2 py-1.5 rounded text-xs font-mono transition-all flex justify-between items-center ${
                pkg === selectedPackage ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              }`}
            >
              <span className="truncate">{pkg}</span>
              <span className="text-[10px] opacity-60 ml-1">{nodeCounts.get(pkg) || 0}</span>
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
