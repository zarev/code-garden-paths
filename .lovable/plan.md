

## Fix: Center the visualization on initial load

### Problem
The canvas transform initializes at `{x: 0, y: 0, scale: 1}`, so the graph appears at whatever raw coordinates the layout produced -- typically off-center or partially out of view.

### Solution
Add a one-time effect that computes the bounding box of all visible nodes and sets the initial transform to center and fit them within the canvas viewport with some padding.

### Technical Details

**File: `src/components/GraphCanvas.tsx`**

1. Add a `hasInitialized` ref to ensure centering only runs once (or when the graph data changes).

2. Add a `useEffect` that runs after the first render (when the canvas has dimensions):
   - Compute the min/max x and y across all nodes (bounding box).
   - Calculate the scale needed to fit that bounding box within the canvas, with ~10% padding.
   - Calculate the translation to center the bounding box in the viewport.
   - Set the transform state accordingly.

3. The centering logic (pseudocode):
   ```
   minX, maxX, minY, maxY = bounding box of all nodes
   graphWidth = maxX - minX
   graphHeight = maxY - minY
   canvasWidth = canvas.clientWidth
   canvasHeight = canvas.clientHeight
   padding = 0.9 (90% of viewport)
   scale = min(canvasWidth * padding / graphWidth, canvasHeight * padding / graphHeight)
   centerX = (canvasWidth / 2) - ((minX + maxX) / 2) * scale
   centerY = (canvasHeight / 2) - ((minY + maxY) / 2) * scale
   setTransform({ x: centerX, y: centerY, scale })
   ```

4. This effect will depend on `graph.nodes` so it re-centers if the graph data changes, but won't fight with user pan/zoom after initialization.

