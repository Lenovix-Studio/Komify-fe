"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BACKEND_URL } from "@/lib/constant";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  BarChart3,
} from "lucide-react";
import { toast } from "sonner";

interface StatusStat {
  name: string;
  count: number;
}

interface DashboardStats {
  totalComics: number;
  statuses: StatusStat[];
}

const statusColorMap: Record<string, { bg: string; text: string; icon: any }> =
  {
    Completed: {
      bg: "bg-emerald-500/10 border-emerald-500/20 text-emerald-500",
      text: "text-emerald-500",
      icon: CheckCircle2,
    },
    Ongoing: {
      bg: "bg-sky-500/10 border-sky-500/20 text-sky-500",
      text: "text-sky-500",
      icon: Clock,
    },
    "Not Completed": {
      bg: "bg-rose-500/10 border-rose-500/20 text-rose-500",
      text: "text-rose-500",
      icon: AlertCircle,
    },
  };

export function DashboardTab() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${BACKEND_URL}/system/dashboard-stats`);
      if (!res.ok) {
        throw new Error("Failed to fetch dashboard stats");
      }
      const data = await res.json();
      setStats(data);
    } catch (error) {
      console.error(error);
      toast.error("Gagal memuat statistik dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Comic Dashboard</h2>
          <p className="text-sm text-muted-foreground">
            Ringkasan status dan data total komik dalam sistem.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchStats}
          disabled={loading}
          className="gap-2 rounded-xl"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-2xl border-border/80 bg-card/60 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Komik
            </CardTitle>
            <BookOpen className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {loading ? "..." : stats?.totalComics || 0}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Semua komik yang terdaftar
            </p>
            <div className="mt-4">
              <Button
                variant="secondary"
                size="sm"
                asChild
                className="w-full justify-between rounded-xl text-xs"
              >
                <Link href="/">
                  <span>Lihat Semua Komik</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {stats?.statuses.map((status) => {
          const config = statusColorMap[status.name] || {
            bg: "bg-muted border-border text-foreground",
            text: "text-foreground",
            icon: BarChart3,
          };
          const Icon = config.icon;

          return (
            <Card
              key={status.name}
              className="rounded-2xl border-border/80 bg-card/60 backdrop-blur-sm"
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {status.name}
                </CardTitle>
                <Icon className={`h-4 w-4 ${config.text}`} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {loading ? "..." : status.count}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Status: {status.name}
                </p>
                <div className="mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="w-full justify-between rounded-xl text-xs hover:border-primary/50"
                  >
                    <Link href={`/?status=${encodeURIComponent(status.name)}`}>
                      <span>Lihat List Komik</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Summary Table Card */}
      <Card className="rounded-2xl border-border/80 bg-card/60 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Status Breakdown
          </CardTitle>
          <CardDescription>
            Rincian komik beserta persentase dari total komik
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats?.statuses.map((status) => {
              const total = stats.totalComics || 1;
              const percentage = Math.round((status.count / total) * 100);

              return (
                <div key={status.name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{status.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {status.count} komik
                      </Badge>
                    </div>
                    <span className="text-muted-foreground">{percentage}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full bg-primary transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
