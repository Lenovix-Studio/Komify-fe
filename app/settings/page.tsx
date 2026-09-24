"use client";

import Link from "next/link";
import { ArrowLeft, Loader2, ShieldAlert, Trash2 } from "lucide-react";
import { useState } from "react";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { BACKEND_URL } from "@/lib/constant";
import { toast } from "sonner";

export default function SettingsPage() {
  const [isResetting, setIsResetting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleResetAllData = async () => {
    try {
      setIsResetting(true);

      const response = await fetch(`${BACKEND_URL}/system/reset-all-data`, {
        method: "POST",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to reset system data");
      }

      toast.success("System Reset Successful", {
        description:
          "All database records and physical storage have been cleared.",
      });
      setIsDialogOpen(false);
    } catch (error: any) {
      console.error(error);

      toast.error("Reset Failed", {
        description:
          error.message || "Something went wrong while resetting data.",
      });
    } finally {
      setIsResetting(false);
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
        centerContent={
          <h1 className="text-2xl font-bold tracking-tight">System Settings</h1>
        }
      />

      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="space-y-6">
          <section className="rounded-3xl border border-destructive/20 bg-card p-6 shadow-xs transition-all">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
                  <Trash2 className="h-6 w-6" />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-foreground">
                      Reset All System Data
                    </h2>
                    <span className="rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-semibold text-destructive">
                      Danger Zone
                    </span>
                  </div>

                  <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                    Deletes all comic metadata, chapters, bookmarks, reading
                    history, and master tags from PostgreSQL, as well as all
                    physical images and files in the storage directory.
                  </p>

                  <div className="mt-4 flex items-start gap-3 rounded-2xl border border-destructive/20 bg-destructive/10 p-4">
                    <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
                    <p className="text-xs sm:text-sm font-medium leading-normal text-destructive">
                      This action is irreversible. All database records and
                      physical comic assets will be permanently wiped.
                    </p>
                  </div>
                </div>
              </div>

              <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <AlertDialogTrigger
                  disabled={isResetting}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-destructive px-6 py-5 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-destructive/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 shrink-0"
                >
                  {isResetting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </AlertDialogTrigger>

                <AlertDialogContent className="rounded-2xl border-destructive/20 sm:max-w-md">
                  <AlertDialogHeader>
                    <div className="mx-auto! mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive sm:mx-0">
                      <ShieldAlert className="h-6 w-6" />
                    </div>
                    <AlertDialogTitle className="text-xl mx-auto">
                      Are you absolutely sure?
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-sm leading-relaxed text-muted-foreground mx-auto text-center">
                      This will permanently wipe all comic records, metadata,
                      reading histories, and clean up physical storage on disk.{" "}
                      <strong className="text-foreground">
                        This action cannot be undone.
                      </strong>
                    </AlertDialogDescription>
                  </AlertDialogHeader>

                  <AlertDialogFooter className="mt-4 gap-2! sm:gap-0 mx-auto bg-transparent border-0">
                    <AlertDialogCancel
                      disabled={isResetting}
                      className="rounded-xl border-border/80"
                    >
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={(e) => {
                        e.preventDefault();
                        handleResetAllData();
                      }}
                      disabled={isResetting}
                      className="rounded-xl bg-destructive text-white hover:bg-destructive/90 gap-2"
                    >
                      {isResetting && (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      )}
                      <span>Yes, wipe everything</span>
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
