import { useRef, useEffect, useState, useCallback } from "react";
import type { ProcessedGraph, FileNode, NodeCategory } from "@/lib/graphProcessor";

interface Props {
  graph: ProcessedGraph;
  onNodeHover: (node: FileNode | null, x: number, y: number) => void;
  onNodeClick: (node: FileNode | null) => void;
  visibleCategories: Set<NodeCategory>;
  selectedPackage: string | null;
}

const CATEGORY_COLORS: Record<NodeCategory, string> = {
  red: "hsl(0, 70%, 55%)",
  orange: "hsl(30, 85%, 55%)",
  blue: "hsl(210, 70%, 55%)",
  purple: "hsl(270, 50%, 60%)",
  green: "hsl(150, 50%, 45%)",
};

const CATEGORY_GLOW: Record<NodeCategory, string> = {
  red: "hsla(0, 70%, 55%, 0.4)",
  orange: "hsla(30, 85%, 55%, 0.3)",
  blue: "hsla(210, 70%, 55%, 0.3)",
  purple: "hsla(270, 50%, 60%, 0.25)",
  green: "hsla(150, 50%, 45%, 0.2)",
};

const ROAD_COLOR = "hsl(225, 15%, 28%)";
const ROAD_GLOW = "hsla(225, 15%, 40%, 0.3)";
const BG_COLOR = "hsl(225, 20%, 11%)";

export default function GraphCanvas({ graph, onNodeHover, onNodeClick, visibleCategories, selectedPackage }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const hoveredRef = useRef<FileNode | null>(null);
  const animFrameRef = useRef<number>(0);
  const hasInitialized = useRef(false);

  // Center and fit the graph on initial load
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || graph.nodes.length === 0) return;
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const nodes = graph.nodes;
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const n of nodes) {
      if (n.x < minX) minX = n.x;
      if (n.x > maxX) maxX = n.x;
      if (n.y < minY) minY = n.y;
      if (n.y > maxY) maxY = n.y;
    }

    const graphWidth = maxX - minX || 1;
    const graphHeight = maxY - minY || 1;
    const canvasWidth = canvas.clientWidth;
    const canvasHeight = canvas.clientHeight;
    const padding = 0.85;
    const scale = Math.min(
      (canvasWidth * padding) / graphWidth,
      (canvasHeight * padding) / graphHeight
    );
    const centerX = canvasWidth / 2 - ((minX + maxX) / 2) * scale;
    const centerY = canvasHeight / 2 - ((minY + maxY) / 2) * scale;

    setTransform({ x: centerX, y: centerY, scale });
  }, [graph.nodes]);

  const getVisibleNodes = useCallback(() => {
    return graph.nodes.filter(n => {
      if (!visibleCategories.has(n.category)) return false;
      if (selectedPackage && n.package !== selectedPackage) return false;
      return true;
    });
  }, [graph.nodes, visibleCategories, selectedPackage]);

  const getVisibleEdges = useCallback(() => {
    const visibleIds = new Set(getVisibleNodes().map(n => n.id));
    return graph.edges.filter(e => visibleIds.has(e.source) && visibleIds.has(e.target));
  }, [graph.edges, getVisibleNodes]);

  const nodeIndex = useCallback(() => {
    const map = new Map<string, FileNode>();
    graph.nodes.forEach(n => map.set(n.id, n));
    return map;
  }, [graph.nodes]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    // Clear
    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.translate(transform.x, transform.y);
    ctx.scale(transform.scale, transform.scale);

    const nodes = getVisibleNodes();
    const edges = getVisibleEdges();
    const nIndex = nodeIndex();
    const maxWeight = Math.max(...edges.map(e => e.totalWeight), 1);

    // Draw edges (roads)
    for (const edge of edges) {
      const src = nIndex.get(edge.source);
      const tgt = nIndex.get(edge.target);
      if (!src || !tgt) continue;

      const weight = Math.max(1, (edge.totalWeight / maxWeight) * 4);
      
      // Glow
      ctx.strokeStyle = ROAD_GLOW;
      ctx.lineWidth = weight + 2;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(src.x, src.y);
      // Curved roads
      const mx = (src.x + tgt.x) / 2 + (src.y - tgt.y) * 0.1;
      const my = (src.y + tgt.y) / 2 + (tgt.x - src.x) * 0.1;
      ctx.quadraticCurveTo(mx, my, tgt.x, tgt.y);
      ctx.stroke();

      // Road
      ctx.strokeStyle = ROAD_COLOR;
      ctx.lineWidth = weight;
      ctx.beginPath();
      ctx.moveTo(src.x, src.y);
      ctx.quadraticCurveTo(mx, my, tgt.x, tgt.y);
      ctx.stroke();

      // If has inherits, draw as dashed (bridge)
      if (edge.inheritCount > 0) {
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = "hsla(45, 90%, 60%, 0.5)";
        ctx.lineWidth = weight * 0.5;
        ctx.beginPath();
        ctx.moveTo(src.x, src.y);
        ctx.quadraticCurveTo(mx, my, tgt.x, tgt.y);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    // Draw nodes (buildings)
    for (const node of nodes) {
      const color = CATEGORY_COLORS[node.category];
      const glow = CATEGORY_GLOW[node.category];
      const isHovered = hoveredRef.current?.id === node.id;
      const s = node.size * (isHovered ? 1.4 : 1);

      // Glow ring
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(node.x, node.y, s + 4, 0, Math.PI * 2);
      ctx.fill();

      // Building body (rounded square)
      const half = s * 0.7;
      ctx.fillStyle = color;
      ctx.shadowColor = glow;
      ctx.shadowBlur = isHovered ? 15 : 8;
      ctx.beginPath();
      roundRect(ctx, node.x - half, node.y - half, half * 2, half * 2, 3);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Inner detail for larger nodes
      if (node.size > 12) {
        ctx.fillStyle = "hsla(0, 0%, 0%, 0.3)";
        const inner = half * 0.5;
        ctx.fillRect(node.x - inner, node.y - inner, inner * 2, inner * 2);
        // "windows" pattern
        ctx.fillStyle = "hsla(0, 0%, 100%, 0.15)";
        const ws = inner * 0.35;
        ctx.fillRect(node.x - ws * 1.5, node.y - ws * 1.5, ws, ws);
        ctx.fillRect(node.x + ws * 0.5, node.y - ws * 1.5, ws, ws);
        ctx.fillRect(node.x - ws * 1.5, node.y + ws * 0.5, ws, ws);
        ctx.fillRect(node.x + ws * 0.5, node.y + ws * 0.5, ws, ws);
      }

      // Label for hovered or large nodes at sufficient zoom
      if ((isHovered || (node.congestionScore > 0.3 && transform.scale > 0.8)) && transform.scale > 0.5) {
        ctx.fillStyle = "hsl(220, 20%, 90%)";
        ctx.font = `${Math.max(9, 11 / transform.scale)}px 'JetBrains Mono', monospace`;
        ctx.textAlign = "center";
        ctx.fillText(node.name, node.x, node.y + s + 14);
      }
    }

    ctx.restore();
  }, [transform, getVisibleNodes, getVisibleEdges, nodeIndex]);

  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [draw]);

  const screenToWorld = useCallback((sx: number, sy: number) => ({
    x: (sx - transform.x) / transform.scale,
    y: (sy - transform.y) / transform.scale,
  }), [transform]);

  const findNodeAt = useCallback((wx: number, wy: number): FileNode | null => {
    const nodes = getVisibleNodes();
    for (let i = nodes.length - 1; i >= 0; i--) {
      const n = nodes[i];
      const dx = wx - n.x;
      const dy = wy - n.y;
      if (dx * dx + dy * dy < (n.size + 4) * (n.size + 4)) return n;
    }
    return null;
  }, [getVisibleNodes]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setDragging(true);
    setDragStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    if (dragging) {
      setTransform(t => ({ ...t, x: e.clientX - dragStart.x, y: e.clientY - dragStart.y }));
      return;
    }

    const wx = (e.clientX - rect.left - transform.x) / transform.scale;
    const wy = (e.clientY - rect.top - transform.y) / transform.scale;
    const node = findNodeAt(wx, wy);
    hoveredRef.current = node;
    onNodeHover(node, e.clientX, e.clientY);
    draw();
  };

  const handleMouseUp = () => setDragging(false);

  const handleClick = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const wx = (e.clientX - rect.left - transform.x) / transform.scale;
    const wy = (e.clientY - rect.top - transform.y) / transform.scale;
    onNodeClick(findNodeAt(wx, wy));
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const factor = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.1, Math.min(5, transform.scale * factor));
    
    setTransform(t => ({
      x: mouseX - (mouseX - t.x) * (newScale / t.scale),
      y: mouseY - (mouseY - t.y) * (newScale / t.scale),
      scale: newScale,
    }));
  };

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full grab-cursor"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={handleClick}
      onWheel={handleWheel}
    />
  );
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
}
