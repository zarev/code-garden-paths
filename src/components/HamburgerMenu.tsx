import { useState } from "react";
import { Menu, X, Globe, Github, Upload, Loader2, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import type { RawGraph } from "@/lib/graphProcessor";

interface HamburgerMenuProps {
  onGraphLoaded: (data: RawGraph) => void;
}

export default function HamburgerMenu({ onGraphLoaded }: HamburgerMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [apiUrl, setApiUrl] = useState(() => localStorage.getItem("cf_api_url") || "");
  const [repoUrl, setRepoUrl] = useState("");
  const [maxFiles, setMaxFiles] = useState("200");
  const [loading, setLoading] = useState(false);

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
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Upload failed (${res.status}): ${text}`);
      }

      const data = await res.json();

      // Normalize edges → links
      if (!data.links && data.edges) {
        data.links = data.edges;
      }

      onGraphLoaded(data);
      toast.success("Repository analyzed successfully");
      setIsOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to analyze repository");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Hamburger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="absolute top-4 left-4 z-50 p-2 rounded-lg bg-card/90 backdrop-blur-sm border border-border hover:bg-secondary/80 transition-colors"
      >
        {isOpen ? (
          <X className="w-5 h-5 text-foreground" />
        ) : (
          <Menu className="w-5 h-5 text-foreground" />
        )}
      </button>

      {/* Slide-out panel */}
      {isOpen && (
        <div className="absolute top-0 left-0 z-40 h-full w-[340px] bg-card/95 backdrop-blur-md border-r border-border shadow-2xl animate-in slide-in-from-left duration-200">
          <div className="pt-16 px-5 pb-5 h-full flex flex-col gap-6 overflow-y-auto">
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

            {/* Upload Zip */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Upload className="w-4 h-4 text-muted-foreground" />
                <h3 className="font-mono text-xs font-semibold text-foreground tracking-wider uppercase">
                  Upload .zip
                </h3>
              </div>
              <label className="block">
                <input
                  type="file"
                  accept=".zip"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (!apiUrl.trim()) {
                      toast.error("Please set the Cloudflare API URL first");
                      return;
                    }
                    setLoading(true);
                    try {
                      const form = new FormData();
                      form.append("file", file);
                      const url = maxFiles
                        ? `${apiUrl.replace(/\/$/, "")}/parse?max_files=${encodeURIComponent(maxFiles)}`
                        : `${apiUrl.replace(/\/$/, "")}/parse`;
                      const res = await fetch(url, { method: "POST", body: form });
                      if (!res.ok) throw new Error(`Upload failed (${res.status})`);
                      const data = await res.json();
                      if (!data.links && data.edges) data.links = data.edges;
                      onGraphLoaded(data);
                      toast.success("Zip analyzed successfully");
                      setIsOpen(false);
                    } catch (err) {
                      toast.error(err instanceof Error ? err.message : "Upload failed");
                    } finally {
                      setLoading(false);
                    }
                  }}
                />
                <div className="flex items-center justify-center h-16 rounded-lg border border-dashed border-border hover:border-primary/50 hover:bg-secondary/30 cursor-pointer transition-colors">
                  <span className="text-xs text-muted-foreground font-mono">
                    Click to upload .zip file
                  </span>
                </div>
              </label>
            </section>
          </div>
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div
          className="absolute inset-0 z-30 bg-background/30"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
