import Link from "next/link";
import { ArrowLeft, Code2, Settings2, Activity } from "lucide-react";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CommonCodeTab } from "./common-code-tab";
import { ResetSystemCard } from "./reset-system-card";
import { LoggingTab } from "./logging-tab";

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
        <Tabs defaultValue="common-code" className="w-full space-y-6">
          <TabsList className="inline-flex h-12 items-center justify-start rounded-2xl bg-muted/60 p-1.5 text-muted-foreground">
            <TabsTrigger
              value="common-code"
              className="flex items-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold transition-all data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs"
            >
              <Code2 className="h-4 w-4" />
              <span>Common Code</span>
            </TabsTrigger>
            <TabsTrigger
              value="logging"
              className="flex items-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold transition-all data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs"
            >
              <Activity className="h-4 w-4" />
              <span>System Logs</span>
            </TabsTrigger>
            <TabsTrigger
              value="other"
              className="flex items-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold transition-all data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs"
            >
              <Settings2 className="h-4 w-4" />
              <span>Other</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="common-code"
            className="focus-visible:outline-none"
          >
            <CommonCodeTab />
          </TabsContent>

          <TabsContent value="logging" className="focus-visible:outline-none">
            <LoggingTab />
          </TabsContent>

          <TabsContent
            value="other"
            className="space-y-6 focus-visible:outline-none"
          >
            <ResetSystemCard />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
