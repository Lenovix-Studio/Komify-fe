import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { ResetSystemCard } from "./reset-system-card";

export const metadata = {
  title: "Settings",
};

export default function SettingsPage() {
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
          <ResetSystemCard />
        </div>
      </main>
    </div>
  );
}
