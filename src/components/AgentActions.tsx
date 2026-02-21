import { Users, Activity, Zap } from "lucide-react";
import { toast } from "sonner";

interface AgentActionsProps {
  topHotspot?: string;
}

const AgentActions = ({ topHotspot }: AgentActionsProps) => {
  const actions = [
    {
      icon: Users,
      title: "Delegate",
      description: "Create a prioritized list of to-do items to fix congestion hotspots and assign each to a team member.",
      button: "Create Tasks",
      accent: "bg-mm-green",
      onClick: () => toast.success("Task list created and assigned to team members."),
    },
    {
      icon: Activity,
      title: "Check Migration Progress",
      description: "Review the current status of ongoing mitigation efforts and track completion.",
      button: "Check Status",
      accent: "bg-mm-blue",
      onClick: () => toast.info("All 3 active migrations are on track. 12 of 28 tasks completed."),
    },
    {
      icon: Zap,
      title: "Execute Next Step",
      description: topHotspot
        ? `Extract shared utilities from \`${topHotspot}\` to reduce fan-out.`
        : "Run the next recommended mitigation action.",
      button: "Execute",
      accent: "bg-mm-orange",
      onClick: () => toast("Executing next mitigation step…", { duration: 3000 }),
    },
  ];

  return (
    <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-30 flex gap-3">
      {actions.map((action) => (
        <button
          key={action.title}
          onClick={action.onClick}
          className="group relative flex w-[260px] gap-3 rounded-lg border border-border/40 bg-card/80 backdrop-blur-md p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/5 hover:border-border/60"
        >
          {/* Accent bar */}
          <div className={`absolute left-0 top-3 bottom-3 w-[3px] rounded-full ${action.accent}`} />

          <div className="flex flex-col gap-2 pl-2 min-w-0">
            <div className="flex items-center gap-2">
              <action.icon className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="font-mono text-xs font-semibold text-foreground truncate">
                {action.title}
              </span>
            </div>
            <p className="font-mono text-[10px] leading-relaxed text-muted-foreground line-clamp-2">
              {action.description}
            </p>
            <span className="inline-flex items-center self-start rounded bg-secondary px-2 py-0.5 font-mono text-[10px] font-medium text-secondary-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              {action.button}
            </span>
          </div>
        </button>
      ))}
    </div>
  );
};

export default AgentActions;
