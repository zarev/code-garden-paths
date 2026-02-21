// Graph data processor - parses JWST graph JSON and aggregates at file level

export interface RawNode {
  type: "File" | "Class" | "Function";
  name: string;
  qualname?: string;
  path: string | null;
  external?: boolean;
  id: string;
}

export interface RawEdge {
  type: "IMPORTS" | "CALLS" | "INHERITS";
  source: string;
  target: string;
}

export interface RawGraph {
  nodes: RawNode[];
  edges: RawEdge[];
}

export type NodeCategory = "red" | "orange" | "blue" | "purple" | "green";

export interface FileNode {
  id: string;
  name: string;        // short filename
  fullPath: string;     // full path
  folder: string;       // parent folder/package
  package: string;      // top-level package
  isExternal: boolean;
  isTest: boolean;
  functionCount: number;
  classCount: number;
  // Metrics
  fanIn: number;        // incoming CALLS from other files
  fanOut: number;       // outgoing CALLS to other files
  externalImports: number;
  internalImports: number;
  crossFileCalls: number;
  // Computed
  category: NodeCategory;
  congestionScore: number;
  // Layout
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
}

export interface FileEdge {
  source: string;
  target: string;
  callCount: number;
  importCount: number;
  inheritCount: number;
  totalWeight: number;
}

export interface ProcessedGraph {
  nodes: FileNode[];
  edges: FileEdge[];
  packages: Map<string, string[]>; // package -> file ids
  stats: GraphStats;
}

export interface GraphStats {
  totalFiles: number;
  totalInternalFiles: number;
  totalExternalModules: number;
  totalEdges: number;
  totalCalls: number;
  totalImports: number;
  maxFanIn: number;
  maxFanOut: number;
  hotspots: string[];
}

const BASE_PATH = "C:\\Users\\anshu\\legacy-profen\\jwst-main\\";

function extractFilePath(nodeId: string): string | null {
  // Extract file path from node id like "func:C:\path\file.py:funcName" or "file:C:\path\file.py"
  if (nodeId.startsWith("module:") || nodeId.includes("external:")) return null;
  
  const parts = nodeId.split(":");
  if (parts[0] === "file") {
    return parts.slice(1).join(":");
  }
  // func: or class: - extract path portion
  const match = nodeId.match(/^(?:func|class):(.+\.py)/);
  if (match) return match[1];
  return null;
}

function getShortPath(fullPath: string): string {
  return fullPath.replace(BASE_PATH, "").replace(/\\/g, "/");
}

function getFolder(shortPath: string): string {
  const parts = shortPath.split("/");
  return parts.length > 1 ? parts.slice(0, -1).join("/") : ".";
}

function getPackage(shortPath: string): string {
  const parts = shortPath.split("/");
  if (parts[0] === "jwst" && parts.length > 1) return `jwst/${parts[1]}`;
  return parts[0];
}

function isTestPath(path: string): boolean {
  return /tests?[/\\]|conftest\.py|test_/.test(path);
}

export function processGraph(raw: RawGraph): ProcessedGraph {
  // Step 1: Build file-level node map
  const fileNodes = new Map<string, FileNode>();
  const nodeToFile = new Map<string, string>(); // nodeId -> fileId
  
  // First pass: identify all internal files
  for (const node of raw.nodes) {
    if (node.external || !node.path) continue;
    
    const fileId = `file:${node.path}`;
    nodeToFile.set(node.id, node.path);
    
    if (!fileNodes.has(node.path)) {
      const shortPath = getShortPath(node.path);
      fileNodes.set(node.path, {
        id: node.path,
        name: shortPath.split("/").pop() || shortPath,
        fullPath: shortPath,
        folder: getFolder(shortPath),
        package: getPackage(shortPath),
        isExternal: false,
        isTest: isTestPath(shortPath),
        functionCount: 0,
        classCount: 0,
        fanIn: 0,
        fanOut: 0,
        externalImports: 0,
        internalImports: 0,
        crossFileCalls: 0,
        category: "green",
        congestionScore: 0,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        size: 8,
      });
    }
    
    const fn = fileNodes.get(node.path)!;
    if (node.type === "Function") fn.functionCount++;
    if (node.type === "Class") fn.classCount++;
  }

  // Step 2: Aggregate edges at file level
  const edgeMap = new Map<string, FileEdge>();
  
  for (const edge of raw.edges) {
    const srcFile = extractFilePath(edge.source);
    const tgtFile = extractFilePath(edge.target);
    const isExternalTarget = edge.target.includes("external:") || edge.target.startsWith("module:");
    
    if (!srcFile || !fileNodes.has(srcFile)) continue;
    
    const srcNode = fileNodes.get(srcFile)!;
    
    if (isExternalTarget) {
      if (edge.type === "IMPORTS") srcNode.externalImports++;
      continue;
    }
    
    if (!tgtFile || !fileNodes.has(tgtFile)) continue;
    if (srcFile === tgtFile) continue; // skip intra-file edges
    
    const tgtNode = fileNodes.get(tgtFile)!;
    const edgeKey = `${srcFile}|||${tgtFile}`;
    
    if (!edgeMap.has(edgeKey)) {
      edgeMap.set(edgeKey, {
        source: srcFile,
        target: tgtFile,
        callCount: 0,
        importCount: 0,
        inheritCount: 0,
        totalWeight: 0,
      });
    }
    
    const fe = edgeMap.get(edgeKey)!;
    if (edge.type === "CALLS") {
      fe.callCount++;
      srcNode.fanOut++;
      srcNode.crossFileCalls++;
      tgtNode.fanIn++;
      tgtNode.crossFileCalls++;
    } else if (edge.type === "IMPORTS") {
      fe.importCount++;
      srcNode.internalImports++;
    } else if (edge.type === "INHERITS") {
      fe.inheritCount++;
    }
    fe.totalWeight = fe.callCount * 2 + fe.importCount + fe.inheritCount * 1.5;
  }

  // Step 3: Compute categories and congestion scores
  const nodes = Array.from(fileNodes.values());
  const maxFanIn = Math.max(...nodes.map(n => n.fanIn), 1);
  const maxFanOut = Math.max(...nodes.map(n => n.fanOut), 1);
  const maxExtImports = Math.max(...nodes.map(n => n.externalImports), 1);

  for (const node of nodes) {
    const normFanIn = node.fanIn / maxFanIn;
    const normFanOut = node.fanOut / maxFanOut;
    const normExtImports = node.externalImports / maxExtImports;
    
    node.congestionScore = normFanIn * 0.4 + normFanOut * 0.3 + normExtImports * 0.15 + 
      (node.crossFileCalls / Math.max(maxFanIn + maxFanOut, 1)) * 0.15;
    
    // Size based on complexity
    node.size = 6 + Math.min(node.functionCount + node.classCount, 30) * 0.8;
    
    // Category assignment
    if (node.isTest) {
      node.category = "purple";
    } else if (normFanIn > 0.5 && node.crossFileCalls > 5) {
      node.category = "red";
    } else if ((normFanIn + normFanOut) > 0.6 || (normFanOut > 0.4 && normFanIn > 0.2)) {
      node.category = "orange";
    } else if (normExtImports > 0.4) {
      node.category = "blue";
    } else {
      node.category = "green";
    }
  }

  // Build packages map
  const packages = new Map<string, string[]>();
  for (const node of nodes) {
    if (!packages.has(node.package)) packages.set(node.package, []);
    packages.get(node.package)!.push(node.id);
  }

  const edges = Array.from(edgeMap.values()).filter(e => e.totalWeight > 0);
  
  // Find hotspots
  const hotspots = nodes
    .filter(n => !n.isTest)
    .sort((a, b) => b.congestionScore - a.congestionScore)
    .slice(0, 10)
    .map(n => n.fullPath);

  return {
    nodes,
    edges,
    packages,
    stats: {
      totalFiles: nodes.length,
      totalInternalFiles: nodes.filter(n => !n.isExternal).length,
      totalExternalModules: 0,
      totalEdges: edges.length,
      totalCalls: edges.reduce((s, e) => s + e.callCount, 0),
      totalImports: edges.reduce((s, e) => s + e.importCount, 0),
      maxFanIn,
      maxFanOut,
      hotspots,
    },
  };
}

// Simple force-directed layout
export function layoutGraph(graph: ProcessedGraph, width: number, height: number): ProcessedGraph {
  const { nodes, edges } = graph;
  
  // Group by package for initial positioning
  const packagePositions = new Map<string, { x: number; y: number }>();
  const pkgList = Array.from(graph.packages.keys());
  const cols = Math.ceil(Math.sqrt(pkgList.length));
  const cellW = width / (cols + 1);
  const cellH = height / (Math.ceil(pkgList.length / cols) + 1);
  
  pkgList.forEach((pkg, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    packagePositions.set(pkg, {
      x: (col + 1) * cellW,
      y: (row + 1) * cellH,
    });
  });

  // Initial positions: clustered by package with jitter
  for (const node of nodes) {
    const pkgPos = packagePositions.get(node.package) || { x: width / 2, y: height / 2 };
    node.x = pkgPos.x + (Math.random() - 0.5) * cellW * 0.6;
    node.y = pkgPos.y + (Math.random() - 0.5) * cellH * 0.6;
    node.vx = 0;
    node.vy = 0;
  }

  // Build node index for edge lookups
  const nodeIndex = new Map<string, number>();
  nodes.forEach((n, i) => nodeIndex.set(n.id, i));

  // Run force simulation (simplified)
  const iterations = 80;
  const repulsion = 800;
  const attraction = 0.003;
  const damping = 0.85;
  const centerGravity = 0.01;
  const cx = width / 2;
  const cy = height / 2;

  for (let iter = 0; iter < iterations; iter++) {
    const alpha = 1 - iter / iterations;
    
    // Repulsion between nearby nodes (use grid-based approximation for perf)
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[j].x - nodes[i].x;
        const dy = nodes[j].y - nodes[i].y;
        const dist = Math.sqrt(dx * dx + dy * dy) + 1;
        if (dist > 200) continue; // skip distant pairs
        
        const force = (repulsion * alpha) / (dist * dist);
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        
        nodes[i].vx -= fx;
        nodes[i].vy -= fy;
        nodes[j].vx += fx;
        nodes[j].vy += fy;
      }
    }

    // Attraction along edges
    for (const edge of edges) {
      const si = nodeIndex.get(edge.source);
      const ti = nodeIndex.get(edge.target);
      if (si === undefined || ti === undefined) continue;
      
      const s = nodes[si];
      const t = nodes[ti];
      const dx = t.x - s.x;
      const dy = t.y - s.y;
      const dist = Math.sqrt(dx * dx + dy * dy) + 1;
      
      const strength = attraction * Math.min(edge.totalWeight, 10) * alpha;
      const fx = dx * strength;
      const fy = dy * strength;
      
      s.vx += fx;
      s.vy += fy;
      t.vx -= fx;
      t.vy -= fy;
    }

    // Center gravity
    for (const node of nodes) {
      node.vx += (cx - node.x) * centerGravity * alpha;
      node.vy += (cy - node.y) * centerGravity * alpha;
    }

    // Apply velocities
    for (const node of nodes) {
      node.vx *= damping;
      node.vy *= damping;
      node.x += node.vx;
      node.y += node.vy;
      // Bound
      node.x = Math.max(40, Math.min(width - 40, node.x));
      node.y = Math.max(40, Math.min(height - 40, node.y));
    }
  }

  return graph;
}
