"use client";

import { useState, useEffect } from "react";
import { BACKEND_URL } from "@/lib/constant";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Trash2,
  RefreshCw,
  Terminal,
  AlertCircle,
  AlertTriangle,
  Info,
  Bug,
  Copy,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function LoggingTab() {
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState("ALL");
  const [sourceFilter, setSourceFilter] = useState("ALL");
  const [selectedLog, setSelectedLog] = useState<any | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`${BACKEND_URL}/system-logs`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (error) {
      console.error("Failed to fetch logs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleClearLogs = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/system-logs`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Gagal menghapus log dari server");
      }

      setLogs([]);
      toast.success("Success clear logs");

      setIsDialogOpen(false);
    } catch (error: any) {
      toast.error(error?.message || "Failed to clear logs");
    }
  };

  const getLevelBadge = (level: string) => {
    switch (level) {
      case "INFO":
        return (
          <Badge
            variant="outline"
            className="bg-blue-500/10 text-blue-500 border-blue-500/20"
          >
            <Info className="w-3 h-3 mr-1" /> INFO
          </Badge>
        );
      case "WARN":
        return (
          <Badge
            variant="outline"
            className="bg-amber-500/10 text-amber-500 border-amber-500/20"
          >
            <AlertTriangle className="w-3 h-3 mr-1" /> WARN
          </Badge>
        );
      case "ERROR":
        return (
          <Badge
            variant="outline"
            className="bg-red-500/10 text-red-500 border-red-500/20"
          >
            <AlertCircle className="w-3 h-3 mr-1" /> ERROR
          </Badge>
        );
      case "FATAL":
        return (
          <Badge
            variant="outline"
            className="bg-rose-500/10 text-rose-500 border-rose-500/20"
          >
            <Bug className="w-3 h-3 mr-1" /> FATAL
          </Badge>
        );
      default:
        return <Badge variant="outline">{level}</Badge>;
    }
  };

  const getSourceBadge = (source: string) => {
    switch (source) {
      case "FRONTEND":
        return (
          <Badge
            variant="secondary"
            className="bg-indigo-500/10 text-indigo-400"
          >
            FRONTEND
          </Badge>
        );
      case "BACKEND":
        return (
          <Badge
            variant="secondary"
            className="bg-emerald-500/10 text-emerald-400"
          >
            BACKEND
          </Badge>
        );
      case "SCRAPER":
        return (
          <Badge
            variant="secondary"
            className="bg-purple-500/10 text-purple-400"
          >
            SCRAPER
          </Badge>
        );
      default:
        return <Badge variant="secondary">{source}</Badge>;
    }
  };

  const filteredLogs = logs.filter((log) => {
    const matchesSearch = log.message
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesLevel = levelFilter === "ALL" || log.level === levelFilter;
    const matchesSource = sourceFilter === "ALL" || log.source === sourceFilter;
    return matchesSearch && matchesLevel && matchesSource;
  });

  return (
    <div className="space-y-6">
      <Card className="border-border/50 bg-card/50 shadow-sm backdrop-blur-xl">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Terminal className="h-5 w-5 text-indigo-500" />
              System Logs
            </CardTitle>
            <CardDescription className="mt-1">
              Centralized monitoring for Frontend, Backend, and Scraper errors.
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={fetchLogs}
              disabled={isLoading}
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <AlertDialogTrigger
                render={(props) => (
                  <Button
                    {...props}
                    variant="destructive"
                    size="sm"
                    className="gap-2 text-white"
                  >
                    <Trash2 className="h-4 w-4" />
                    Clear Logs
                  </Button>
                )}
              />
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete
                    all stored activity logs from the system.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <Button
                    variant="destructive"
                    onClick={handleClearLogs}
                    className="text-white"
                  >
                    Yes, Clear Logs
                  </Button>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6 flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search error messages..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-9 h-10 rounded-xl bg-card border-border/80 focus-visible:bg-background focus-visible:ring-primary/30 shadow-xs transition-all placeholder:text-muted-foreground/70"
              />
            </div>
            <div className="flex gap-2">
              <Select
                value={levelFilter}
                onValueChange={(val: any) => setLevelFilter(val || "ALL")}
              >
                <SelectTrigger className="w-[130px] bg-background/50 h-10!">
                  <SelectValue placeholder="Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Levels</SelectItem>
                  <SelectItem value="INFO">Info</SelectItem>
                  <SelectItem value="WARN">Warning</SelectItem>
                  <SelectItem value="ERROR">Error</SelectItem>
                  <SelectItem value="FATAL">Fatal</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={sourceFilter}
                onValueChange={(val: any) => setSourceFilter(val || "ALL")}
              >
                <SelectTrigger className="w-[140px] bg-background/50 h-10!">
                  <SelectValue placeholder="Source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Sources</SelectItem>
                  <SelectItem value="FRONTEND">Frontend</SelectItem>
                  <SelectItem value="BACKEND">Backend</SelectItem>
                  <SelectItem value="SCRAPER">Scraper</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-xl border border-border/50 bg-background/50 overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="w-[180px]">Timestamp</TableHead>
                  <TableHead className="w-[100px]">Level</TableHead>
                  <TableHead className="w-[120px]">Source</TableHead>
                  <TableHead>Message</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="h-32 text-center text-muted-foreground"
                    >
                      {isLoading ? "Loading logs..." : "No logs found."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log) => (
                    <TableRow
                      key={log.id}
                      className="cursor-pointer hover:bg-muted/30 transition-colors"
                      onClick={() => setSelectedLog(log)}
                    >
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {new Date(log.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell>{getLevelBadge(log.level)}</TableCell>
                      <TableCell>{getSourceBadge(log.source)}</TableCell>
                      <TableCell
                        className="font-medium truncate max-w-[300px]"
                        title={log.message}
                      >
                        {log.message}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={!!selectedLog}
        onOpenChange={(open) => !open && setSelectedLog(null)}
      >
        <DialogContent className="sm:max-w-3xl bg-zinc-950 border-zinc-800 text-zinc-200">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl">
              {selectedLog && getLevelBadge(selectedLog.level)}
              <span className="text-zinc-100">Log Details</span>
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              {selectedLog && new Date(selectedLog.created_at).toLocaleString()}{" "}
              | {selectedLog?.source}
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="mt-4 space-y-6">
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-zinc-400">
                    Message
                  </h4>
                  <button
                    onClick={() => handleCopy(selectedLog.message, "Message")}
                    className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    <Copy className="h-3.5 w-3.5" /> Copy
                  </button>
                </div>
                <div className="rounded-lg bg-zinc-900 border border-zinc-800 p-4 font-mono text-sm text-rose-300 whitespace-pre-wrap text-wrap">
                  {selectedLog.message}
                </div>
              </div>

              {selectedLog.context &&
                Object.keys(selectedLog.context).length > 0 && (
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-zinc-400">
                        Context / Payload
                      </h4>
                      <button
                        onClick={() =>
                          handleCopy(
                            JSON.stringify(selectedLog.context, null, 2),
                            "Context",
                          )
                        }
                        className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                      >
                        <Copy className="h-3.5 w-3.5" /> Copy
                      </button>
                    </div>
                    <pre className="rounded-lg bg-zinc-900 border border-zinc-800 p-4 font-mono text-xs overflow-x-auto text-zinc-300 whitespace-pre-wrap text-wrap">
                      {JSON.stringify(selectedLog.context, null, 2)}
                    </pre>
                  </div>
                )}

              {selectedLog.stack_trace && (
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-zinc-400">
                      Stack Trace
                    </h4>
                    <button
                      onClick={() =>
                        handleCopy(selectedLog.stack_trace, "Stack Trace")
                      }
                      className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                      <Copy className="h-3.5 w-3.5" /> Copy
                    </button>
                  </div>
                  <pre className="rounded-lg bg-zinc-900 border border-zinc-800 p-4 font-mono text-xs overflow-x-auto text-zinc-500 whitespace-pre-wrap text-wrap">
                    {selectedLog.stack_trace}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
