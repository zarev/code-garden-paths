import { useState } from "react";
import { X, Globe, Github, Key, FileText, Loader2, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import type { RawGraph } from "@/lib/graphProcessor";

interface HamburgerMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onGraphLoaded: (data: RawGraph) => void;
}

export default function HamburgerMenu({ isOpen, onClose, onGraphLoaded }: HamburgerMenuProps) {
  const [apiUrl, setApiUrl] = useState(() => localStorage.getItem("cf_api_url") || "");
  const [geminiKey, setGeminiKey] = useState(() => localStorage.getItem("cf_gemini_key") || "");
  const [projectContext, setProjectContext] = useState(() => localStorage.getItem("cf_project_context") || "");
  const [repoUrl, setRepoUrl] = useState("");
  const [maxFiles, setMaxFiles] = useState("200");
  const [loading, setLoading] = useState(false);

  const saveGeminiKey = () => {
    localStorage.setItem("cf_gemini_key", geminiKey);
    toast.success("Gemini API key saved");
  };

  const saveProjectContext = () => {
    localStorage.setItem("cf_project_context", projectContext);
    toast.success("Project context saved");
  };

  const saveApiUrl = () => {
    localStorage.setItem("cf_api_url", apiUrl);
    toast.success("API URL saved");
  };

  const handleAnalyzeRepo = async () => {
    if (!apiUrl.trim()) {
      toast.error("Please set the Cloudflare API URL first");
      return;
    }
    if (!repoUrl.trim()) {
      toast.error("Please enter a GitHub repository URL");
      return;
    }

    setLoading(true);
    try {
      const endpoint = maxFiles
        ? `${apiUrl.replace(/\/$/, "")}/parse?max_files=${encodeURIComponent(maxFiles)}&repo_url=${encodeURIComponent(repoUrl)}`
        : `${apiUrl.replace(/\/$/, "")}/parse?repo_url=${encodeURIComponent(repoUrl)}`;

      const res = await fetch(endpoint, { method: "POST" });
      const text = await res.text();

      if (!res.ok) {
        throw new Error(`API error ${res.status}: ${text}`);
      }

      const data = JSON.parse(text);

      // Normalize edges → links
      if (!data.links && data.edges) {
        data.links = data.edges;
      }

      onGraphLoaded(data);
      toast.success("Repository analyzed successfully");
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to analyze repository");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Slide-out panel */}
        <div className="absolute top-0 left-0 z-40 h-full w-[340px] bg-card/95 backdrop-blur-md border-r border-border shadow-2xl animate-in slide-in-from-left duration-200">
          <div className="pt-4 px-5 pb-5 h-full flex flex-col gap-6 overflow-y-auto">
            <div className="flex justify-end">
              <button onClick={onClose} className="p-1 rounded hover:bg-secondary/50 transition-colors">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            {/* API Configuration */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Settings className="w-4 h-4 text-muted-foreground" />
                <h3 className="font-mono text-xs font-semibold text-foreground tracking-wider uppercase">
                  API Configuration
                </h3>
              </div>
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground font-mono">Cloudflare Tunnel URL</label>
                <div className="flex gap-2">
                  <Input
                    value={apiUrl}
                    onChange={e => setApiUrl(e.target.value)}
                    placeholder="https://xxxx.trycloudflare.com"
                    className="text-xs font-mono h-8 bg-secondary/50 border-border"
                  />
                  <Button size="sm" variant="secondary" onClick={saveApiUrl} className="h-8 px-3 text-xs">
                    Save
                  </Button>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <label className="text-xs text-muted-foreground font-mono whitespace-nowrap">Max files</label>
                  <Input
                    value={maxFiles}
                    onChange={e => setMaxFiles(e.target.value)}
                    placeholder="200"
                    type="number"
                    className="text-xs font-mono h-8 bg-secondary/50 border-border w-24"
                  />
                </div>
              </div>
            </section>

            <div className="h-px bg-border" />

            {/* Analyze Repository */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Github className="w-4 h-4 text-muted-foreground" />
                <h3 className="font-mono text-xs font-semibold text-foreground tracking-wider uppercase">
                  Analyze Repository
                </h3>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground font-mono">GitHub Repository URL</label>
                  <Input
                    value={repoUrl}
                    onChange={e => setRepoUrl(e.target.value)}
                    placeholder="https://github.com/owner/repo"
                    className="text-xs font-mono h-8 bg-secondary/50 border-border mt-1"
                  />
                </div>
                <Button
                  onClick={handleAnalyzeRepo}
                  disabled={loading || !repoUrl.trim() || !apiUrl.trim()}
                  className="w-full h-9 text-xs font-mono gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Globe className="w-3.5 h-3.5" />
                      Analyze Repository
                    </>
                  )}
                </Button>
              </div>
            </section>

            <div className="h-px bg-border" />

            {/* Gemini API Key */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Key className="w-4 h-4 text-muted-foreground" />
                <h3 className="font-mono text-xs font-semibold text-foreground tracking-wider uppercase">
                  Gemini API Key
                </h3>
              </div>
              <div className="flex gap-2">
                <Input
                  value={geminiKey}
                  onChange={e => setGeminiKey(e.target.value)}
                  placeholder="AIza..."
                  type="password"
                  className="text-xs font-mono h-8 bg-secondary/50 border-border"
                />
                <Button size="sm" variant="secondary" onClick={saveGeminiKey} className="h-8 px-3 text-xs">
                  Save
                </Button>
              </div>
            </section>

            <div className="h-px bg-border" />

            {/* Project Context */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <h3 className="font-mono text-xs font-semibold text-foreground tracking-wider uppercase">
                  Project Context
                </h3>
              </div>
              <div className="space-y-2">
                <textarea
                  value={projectContext}
                  onChange={e => setProjectContext(e.target.value)}
                  placeholder="Describe what this repository is about, its architecture, key technologies, etc."
                  rows={6}
                  className="flex w-full rounded-md border border-border bg-secondary/50 px-3 py-2 text-xs font-mono ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-y"
                />
                <Button size="sm" variant="secondary" onClick={saveProjectContext} className="h-8 px-3 text-xs w-full">
                  Save Context
                </Button>
              </div>
            </section>
          </div>
        </div>

      {/* Backdrop */}
      <div
        className="absolute inset-0 z-30 bg-background/30"
        onClick={onClose}
      />
    </>
  );
}
