import { useState, useEffect, useCallback, useMemo } from "react";
import { processGraph, layoutGraph, type ProcessedGraph, type FileNode, type NodeCategory, type RawGraph } from "@/lib/graphProcessor";
import GraphCanvas from "@/components/GraphCanvas";
import Legend from "@/components/Legend";
import NodeTooltip from "@/components/NodeTooltip";
import PackageSelector from "@/components/PackageSelector";
import NodeDetail from "@/components/NodeDetail";

type LoadState = "loading" | "processing" | "layouting" | "ready" | "error";

const Index = () => {
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [graph, setGraph] = useState<ProcessedGraph | null>(null);
  const [error, setError] = useState<string>("");
  const [hoveredNode, setHoveredNode] = useState<{ node: FileNode; x: number; y: number } | null>(null);
  const [selectedNode, setSelectedNode] = useState<FileNode | null>(null);
  const [visibleCategories, setVisibleCategories] = useState<Set<NodeCategory>>(
    new Set(["red", "orange", "blue", "purple", "green"])
  );
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoadState("loading");
        const resp = await fetch("/data/jwst_graph.json");
        if (!resp.ok) throw new Error("Failed to load graph data");
        
        setLoadState("processing");
        const raw: RawGraph = await resp.json();
        
        const processed = processGraph(raw);
        
        setLoadState("layouting");
        // Use requestAnimationFrame to let UI update
        await new Promise(r => requestAnimationFrame(r));
        
        const laid = layoutGraph(processed, 3000, 2000);
        
        setGraph(laid);
        setLoadState("ready");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unknown error");
        setLoadState("error");
      }
    }
    load();
  }, []);

  const toggleCategory = useCallback((cat: NodeCategory) => {
    setVisibleCategories(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }, []);

  const handleNodeHover = useCallback((node: FileNode | null, x: number, y: number) => {
    setHoveredNode(node ? { node, x, y } : null);
  }, []);

  const handleNodeClick = useCallback((node: FileNode | null) => {
    setSelectedNode(node);
  }, []);

  const packages = useMemo(() => {
    if (!graph) return [];
    return Array.from(graph.packages.keys()).sort();
  }, [graph]);

  const nodeCounts = useMemo(() => {
    if (!graph) return new Map<string, number>();
    const counts = new Map<string, number>();
    graph.packages.forEach((ids, pkg) => counts.set(pkg, ids.length));
    return counts;
  }, [graph]);

  if (loadState !== "ready" || !graph) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background gap-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-lg bg-secondary flex items-center justify-center">
            <div className="w-8 h-8 rounded-sm bg-mm-green animate-pulse-glow" />
          </div>
          {loadState !== "error" && (
            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-mm-blue animate-pulse" />
          )}
        </div>
        <div className="text-center">
          <h1 className="font-mono text-lg font-semibold text-foreground mb-1">
            {loadState === "error" ? "Error" : "Building Traffic Map"}
          </h1>
          <p className="text-sm text-muted-foreground font-mono">
            {loadState === "loading" && "Fetching graph data..."}
            {loadState === "processing" && "Analyzing dependencies..."}
            {loadState === "layouting" && "Computing layout..."}
            {loadState === "error" && error}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-background">
      <GraphCanvas
        graph={graph}
        onNodeHover={handleNodeHover}
        onNodeClick={handleNodeClick}
        visibleCategories={visibleCategories}
        selectedPackage={selectedPackage}
      />

      <Legend
        visibleCategories={visibleCategories}
        toggleCategory={toggleCategory}
        stats={graph.stats}
      />

      <PackageSelector
        packages={packages}
        selectedPackage={selectedPackage}
        onSelect={setSelectedPackage}
        nodeCounts={nodeCounts}
      />

      {hoveredNode && (
        <NodeTooltip node={hoveredNode.node} x={hoveredNode.x} y={hoveredNode.y} />
      )}

      {selectedNode && graph && (
        <NodeDetail
          node={selectedNode}
          graph={graph}
          onClose={() => setSelectedNode(null)}
        />
      )}

      {/* Title bar */}
      <div className="absolute bottom-4 right-4 text-right">
        <div className="font-mono text-[10px] text-muted-foreground opacity-60">
          JWST Pipeline · Codebase Traffic Map
        </div>
      </div>
    </div>
  );
};

export default Index;
