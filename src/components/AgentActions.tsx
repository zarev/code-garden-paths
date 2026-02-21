import { useState } from "react";
import { Users, Activity, Zap, ChevronDown, X } from "lucide-react";

interface AgentActionsProps {
  topHotspot?: string;
}

const delegateTasks = [
  { task: "Extract shared utilities from high fan-out modules", assignee: "Alice Chen", status: "pending" },
  { task: "Break circular dependency in pipeline core", assignee: "Bob Park", status: "pending" },
  { task: "Reduce fan-in on assign_wcs by splitting interface", assignee: "Carol Wu", status: "pending" },
  { task: "Add facade pattern to datamodels entry points", assignee: "Dan Lee", status: "pending" },
  { task: "Decouple step-level transforms from top-level orchestrator", assignee: "Eva Ruiz", status: "pending" },
];

const migrationItems = [
  { name: "Pipeline core decoupling", progress: 72, total: 14, done: 10 },
  { name: "Datamodels facade", progress: 43, total: 7, done: 3 },
  { name: "WCS module split", progress: 14, total: 7, done: 1 },
];

const AgentActions = ({ topHotspot }: AgentActionsProps) => {
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  const toggle = (title: string) => {
    setExpandedCard(prev => (prev === title ? null : title));
  };

  const actions = [
    {
      icon: Users,
      title: "Delegate",
      description: "Create a prioritized list of to-do items to fix congestion hotspots and assign each to a team member.",
      button: "Create Tasks",
      accent: "bg-mm-green",
    },
    {
      icon: Activity,
      title: "Check Migration Progress",
      description: "Review the current status of ongoing mitigation efforts and track completion.",
      button: "Check Status",
      accent: "bg-mm-blue",
    },
    {
      icon: Zap,
      title: "Execute Next Step",
      description: topHotspot
        ? `Extract shared utilities from \`${topHotspot}\` to reduce fan-out.`
        : "Run the next recommended mitigation action.",
      button: "Execute",
      accent: "bg-mm-orange",
    },
  ];

  return (
    <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-30 flex gap-3 items-end">
      {actions.map((action) => {
        const isExpanded = expandedCard === action.title;

        return (
          <div
            key={action.title}
            className={`relative flex flex-col rounded-lg border border-border/40 bg-card/80 backdrop-blur-md text-left transition-all ${
              isExpanded ? "w-[320px]" : "w-[260px]"
            }`}
          >
            {/* Accent bar */}
            <div className={`absolute left-0 top-3 ${isExpanded ? "bottom-3" : "bottom-3"} w-[3px] rounded-full ${action.accent}`} />

            {/* Header - always visible */}
            <button
              onClick={() => toggle(action.title)}
              className="group flex flex-col gap-2 p-4 pl-5 min-w-0 w-full text-left hover:-translate-y-0.5 transition-all"
            >
              <div className="flex items-center gap-2 w-full">
                <action.icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="font-mono text-xs font-semibold text-foreground truncate flex-1">
                  {action.title}
                </span>
                <ChevronDown className={`h-3 w-3 text-muted-foreground transition-transform ${isExpanded ? "rotate-180" : ""}`} />
              </div>
              <p className="font-mono text-[10px] leading-relaxed text-muted-foreground line-clamp-2">
                {action.description}
              </p>
              <span className="inline-flex items-center self-start rounded bg-secondary px-2 py-0.5 font-mono text-[10px] font-medium text-secondary-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                {action.button}
              </span>
            </button>

            {/* Expanded content */}
            {isExpanded && (
              <div className="border-t border-border/30 px-4 pb-4 pt-3 animate-in slide-in-from-top-2 fade-in duration-200">
                {action.title === "Delegate" && (
                  <div className="flex flex-col gap-2">
                    {delegateTasks.map((t, i) => (
                      <div key={i} className="flex items-start gap-2 font-mono text-[10px]">
                        <div className="mt-0.5 h-3 w-3 shrink-0 rounded-sm border border-border/60 bg-secondary" />
                        <div className="flex-1 min-w-0">
                          <p className="text-foreground leading-tight">{t.task}</p>
                          <p className="text-muted-foreground mt-0.5">→ {t.assignee}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {action.title === "Check Migration Progress" && (
                  <div className="flex flex-col gap-3">
                    {migrationItems.map((m, i) => (
                      <div key={i} className="font-mono text-[10px]">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-foreground font-medium">{m.name}</span>
                          <span className="text-muted-foreground">{m.done}/{m.total}</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                          <div
                            className="h-full rounded-full bg-mm-blue transition-all"
                            style={{ width: `${m.progress}%` }}
                          />
                        </div>
                      </div>
                    ))}
                    <p className="font-mono text-[10px] text-muted-foreground mt-1">
                      Overall: 14 of 28 tasks completed (50%)
                    </p>
                  </div>
                )}

                {action.title === "Execute Next Step" && (
                  <div className="flex flex-col gap-2 font-mono text-[10px]">
                    <div className="rounded bg-secondary/60 p-2">
                      <p className="text-muted-foreground mb-1">Target module</p>
                      <p className="text-foreground font-medium">{topHotspot || "N/A"}</p>
                    </div>
                    <div className="rounded bg-secondary/60 p-2">
                      <p className="text-muted-foreground mb-1">Action</p>
                      <p className="text-foreground">Identify top 5 shared imports and extract into a <code className="text-mm-orange">_utils.py</code> submodule</p>
                    </div>
                    <div className="rounded bg-secondary/60 p-2">
                      <p className="text-muted-foreground mb-1">Expected impact</p>
                      <p className="text-foreground">~30% reduction in fan-out for this package</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default AgentActions;
