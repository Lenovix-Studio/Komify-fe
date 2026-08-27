"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Database,
  Folder,
  Loader2,
  ShieldAlert,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  const [isResetting, setIsResetting] = useState(false);
  const [isClearingStorage, setIsClearingStorage] = useState(false);

  const handleResetDatabase = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to reset all database data?\n\nThis action cannot be undone.",
    );

    if (!confirmed) return;

    try {
      setIsResetting(true);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/system/reset-all-data`,
        {
          method: "POST",
        },
      );

      if (!response.ok) {
        throw new Error("Failed to reset database");
      }

      alert("Database reset successfully.");
    } catch (error) {
      console.error(error);
      alert("Failed to reset database.");
    } finally {
      setIsResetting(false);
    }
  };

  const handleClearStorage = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to clear the storage folder?\n\nAll uploaded assets will be permanently deleted.",
    );

    if (!confirmed) return;

    try {
      setIsClearingStorage(true);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/system/clear-storage`,
        {
          method: "POST",
        },
      );

      if (!response.ok) {
        throw new Error("Failed to clear storage");
      }

      alert("Storage folder cleared successfully.");
    } catch (error) {
      console.error(error);
      alert("Failed to clear storage.");
    } finally {
      setIsClearingStorage(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header
        logo={false}
        showSearch={false}
        showRandom={false}
        leftContent={
          <Button
            variant="outline"
            size="sm"
            asChild
            className="gap-1.5 rounded-xl border-border/80 bg-card hover:bg-accent hover:text-foreground shadow-xs"
          >
            <Link href="/">
              <ArrowLeft className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Back</span>
            </Link>
          </Button>
        }
      />

      <main className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="mb-6 text-2xl font-bold tracking-tight">
          System Settings
        </h1>

        <div className="space-y-6">
          <section className="rounded-3xl border border-border/80 bg-card p-6 shadow-xs transition-all">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Database className="h-6 w-6" />
                </div>

                <div>
                  <h2 className="text-lg font-bold text-foreground">
                    Reset Database
                  </h2>

                  <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                    Delete all comic metadata, chapters, bookmarks, ratings, and
                    application data stored in PostgreSQL.
                  </p>

                  <div className="mt-4 flex items-start gap-3 rounded-2xl border border-destructive/20 bg-destructive/10 p-4">
                    <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
                    <p className="text-xs sm:text-sm leading-normal text-destructive font-medium">
                      This action cannot be undone. All database records will be
                      permanently removed.
                    </p>
                  </div>
                </div>
              </div>

              <Button
                variant="destructive"
                onClick={handleResetDatabase}
                disabled={isResetting}
                className="gap-2 rounded-2xl px-6 py-5 text-sm font-semibold shadow-xs shrink-0 text-white"
              >
                {isResetting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                <span>
                  {isResetting ? "Resetting Database..." : "Reset Database"}
                </span>
              </Button>
            </div>
          </section>

          <section className="rounded-3xl border border-border/80 bg-card p-6 shadow-xs transition-all">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <Folder className="h-6 w-6" />
                </div>

                <div>
                  <h2 className="text-lg font-bold text-foreground">
                    Clear Storage Folder
                  </h2>

                  <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                    Delete all uploaded comic files and chapter images stored
                    inside the{" "}
                    <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs font-semibold text-foreground">
                      /storage
                    </code>{" "}
                    directory.
                  </p>

                  <div className="mt-4 flex items-start gap-3 rounded-2xl border border-destructive/20 bg-destructive/10 p-4">
                    <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
                    <p className="text-xs sm:text-sm leading-normal text-destructive font-medium">
                      All uploaded images and comic assets will be permanently
                      deleted from disk.
                    </p>
                  </div>
                </div>
              </div>

              <Button
                variant="destructive"
                onClick={handleClearStorage}
                disabled={isClearingStorage}
                className="gap-2 rounded-2xl px-6 py-5 text-sm font-semibold shadow-xs shrink-0 text-white"
              >
                {isClearingStorage ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                <span>
                  {isClearingStorage ? "Clearing Storage..." : "Clear Storage"}
                </span>
              </Button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
