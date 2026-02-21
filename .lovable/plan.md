

## Add Agent Action Cards at the Bottom of the Screen

### Overview
Add a row of 3 action cards pinned to the bottom-center of the screen. These represent suggested actions that an AI agent could execute to help mitigate code complexity issues detected in the visualization.

### The Three Cards

1. **Delegate** -- Icon: Users/ListTodo. Description: "Create a prioritized list of to-do items to fix congestion hotspots and assign each to a team member." A call-to-action button labeled "Create Tasks".

2. **Check Migration Progress** -- Icon: Activity/BarChart. Description: "Review the current status of ongoing mitigation efforts and track completion." A call-to-action button labeled "Check Status".

3. **Execute Next Step** -- Icon: Play/Zap. Description: "Run the next recommended mitigation action." Includes a brief preview of what the step involves (e.g., "Extract shared utilities from `jwst/assign_wcs` to reduce fan-out"). A call-to-action button labeled "Execute".

### Visual Design
- Cards sit in a horizontal row, centered at the bottom of the screen with some padding.
- Semi-transparent dark background with subtle border, matching the existing UI style (dark theme, mono font).
- Each card has a small colored accent on the left edge (green, blue, orange respectively) to differentiate them visually.
- Cards have a hover effect (slight lift/glow).
- Clicking a card triggers a toast notification for now (placeholder behavior) indicating the action has been queued.

### Technical Details

**New file: `src/components/AgentActions.tsx`**
- A React component rendering 3 styled cards using the existing Card UI components.
- Each card displays: icon, title, description, and a small action button.
- On click, fires a `sonner` toast with a confirmation message.
- The "Execute Next Step" card will derive its description from the graph data -- showing the most congested node's package as the target.

**Modified file: `src/pages/Index.tsx`**
- Import and render `<AgentActions />` inside the main layout, positioned with `absolute bottom-16 left-1/2 -translate-x-1/2` (above the existing title bar).
- Pass the graph data so the "Execute" card can show contextual info about the top hotspot.
- Move the existing bottom-right title bar up slightly or keep it as-is since the action cards will be centered and won't overlap.

