import { useEffect, useRef } from "react";
import {
  useAdminGetConsole,
  getAdminGetConsoleQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Terminal as TerminalIcon } from "lucide-react";
import { format } from "date-fns";

const LEVEL_COLORS: Record<string, string> = {
  info: "text-sky-400",
  warn: "text-amber-400",
  error: "text-red-400",
  debug: "text-zinc-500",
};

export default function AdminConsole() {
  const { data: lines = [] } = useAdminGetConsole({
    query: {
      refetchInterval: 4000,
      queryKey: getAdminGetConsoleQueryKey(),
    },
  });
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [lines]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <TerminalIcon className="w-7 h-7" />
            Консоль
          </h1>
          <p className="text-muted-foreground mt-1">Лента событий PriceHub в реальном времени.</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
          </span>
          LIVE
        </div>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="border-b py-3">
          <CardTitle className="text-sm font-mono text-muted-foreground flex items-center gap-2">
            <Activity className="w-4 h-4" /> /var/log/pricehub.log
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div
            ref={ref}
            className="font-mono text-xs leading-6 p-4 max-h-[68vh] overflow-auto bg-black/40"
            style={{
              backgroundImage:
                "repeating-linear-gradient(0deg, rgba(255,255,255,0.015) 0px, rgba(255,255,255,0.015) 1px, transparent 1px, transparent 3px)",
            }}
          >
            {lines.length === 0 && (
              <div className="text-zinc-600">// Нет событий…</div>
            )}
            {lines.map((l: any) => (
              <div key={l.id} className="flex gap-3 hover:bg-white/[0.02] px-1">
                <span className="text-zinc-600 shrink-0">
                  {format(new Date(l.createdAt), "HH:mm:ss")}
                </span>
                <span className={`uppercase font-bold shrink-0 ${LEVEL_COLORS[l.level] ?? "text-zinc-400"}`}>
                  [{l.level}]
                </span>
                <span className="text-zinc-500 shrink-0">{l.source}</span>
                <span className="text-zinc-200 break-all">{l.message}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
