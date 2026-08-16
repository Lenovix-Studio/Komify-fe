"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Database,
  Folder,
  HardDrive,
  ShieldAlert,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  const [isResetting, setIsResetting] = useState(false);
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

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <Header
        logo={false}
        showSearch={false}
        showRandom={false}
        leftContent={
          <Button
            variant="outline"
            size="sm"
            asChild
            className="gap-1.5 rounded-xl border-border/80 bg-background/50 hover:bg-accent"
          >
            <Link href="/">
              <ArrowLeft className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Back</span>
            </Link>
          </Button>
        }
      />

      {/* Content */}
      <main className="mx-auto max-w-5xl px-6 py-10">
        {/* Sections */}
        <div className="space-y-6">
          {/* Database */}
          <section className="rounded-3xl border border-zinc-800 bg-zinc-900/40 p-6 backdrop-blur-xl">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              {/* Info */}
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400">
                  <Database className="h-6 w-6" />
                </div>

                <div>
                  <h2 className="text-xl font-bold text-white">
                    Reset Database
                  </h2>

                  <p className="mt-2 max-w-2xl text-sm leading-7 text-zinc-500">
                    Delete all comic metadata, chapters, bookmarks, ratings, and
                    application data stored in PostgreSQL.
                  </p>

                  {/* Warning */}
                  <div className="mt-4 flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-4">
                    <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />

                    <p className="text-sm leading-6 text-red-200">
                      This action cannot be undone. All database records will be
                      permanently removed.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action */}
              <button
                onClick={handleResetDatabase}
                disabled={isResetting}
                className="group flex items-center justify-center gap-2 rounded-2xl border border-red-500/20 bg-red-500/10 px-6 py-4 text-sm font-semibold text-red-300 transition hover:border-red-500/40 hover:bg-red-500/20 hover:text-red-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Trash2
                  className={`h-4 w-4 transition ${
                    isResetting ? "animate-spin" : "group-hover:scale-110"
                  }`}
                />

                <span>
                  {isResetting ? "Resetting Database..." : "Reset Database"}
                </span>
              </button>
            </div>
          </section>

          {/* Storage */}
          <section className="rounded-3xl border border-zinc-800 bg-zinc-900/40 p-6 backdrop-blur-xl">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              {/* Info */}
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400">
                  <Folder className="h-6 w-6" />
                </div>

                <div>
                  <h2 className="text-xl font-bold text-white">
                    Clear Storage Folder
                  </h2>

                  <p className="mt-2 max-w-2xl text-sm leading-7 text-zinc-500">
                    Delete all uploaded comic files and chapter images stored
                    inside the{" "}
                    <span className="font-semibold text-zinc-300">
                      /storage
                    </span>{" "}
                    directory.
                  </p>

                  {/* Warning */}
                  <div className="mt-4 flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-4">
                    <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />

                    <p className="text-sm leading-6 text-red-200">
                      All uploaded images and comic assets will be permanently
                      deleted from disk.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action */}
              <button className="group flex items-center justify-center gap-2 rounded-2xl border border-red-500/20 bg-red-500/10 px-6 py-4 text-sm font-semibold text-red-300 transition hover:border-red-500/40 hover:bg-red-500/20 hover:text-red-200">
                <Trash2 className="h-4 w-4 transition group-hover:scale-110" />

                <span>Clear Storage</span>
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
