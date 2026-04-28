import {
  useAdminListNodes,
  useAdminRestartServer,
  getAdminListNodesQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Server, RefreshCw, Loader2 } from "lucide-react";
import { Can } from "@/lib/auth";
import { toast } from "sonner";

const STATUS_COLOR: Record<string, string> = {
  healthy: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
  degraded: "bg-amber-500/20 text-amber-400 border-amber-500/40",
  down: "bg-red-500/20 text-red-400 border-red-500/40",
  restarting: "bg-sky-500/20 text-sky-400 border-sky-500/40",
};

export default function AdminServers() {
  const qc = useQueryClient();
  const { data: nodes = [], isLoading } = useAdminListNodes({
    query: {
      refetchInterval: 5000,
      queryKey: getAdminListNodesQueryKey(),
    },
  });
  const restart = useAdminRestartServer();

  const onRestart = (nodeId: string) => {
    restart.mutate(
      { data: { nodeId } } as any,
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getAdminListNodesQueryKey() });
          toast.success(`Перезапуск ${nodeId} инициирован`);
        },
        onError: (e: any) => toast.error(e?.message ?? "Ошибка"),
      },
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Server className="w-7 h-7" /> Серверы
        </h1>
        <p className="text-muted-foreground mt-1">Состояние нод и нагрузка по регионам.</p>
      </div>

      {isLoading ? (
        <div className="py-12 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {nodes.map((n: any) => (
            <Card key={n.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <CardTitle className="text-base truncate">{n.name}</CardTitle>
                    <div className="text-xs font-mono text-muted-foreground mt-1">
                      {n.region} · {n.id}
                    </div>
                  </div>
                  <Badge variant="outline" className={`font-mono ${STATUS_COLOR[n.status] ?? ""}`}>
                    {n.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-mono text-muted-foreground mb-1">
                    <span>CPU</span>
                    <span>{n.cpu.toFixed(1)}%</span>
                  </div>
                  <Progress value={n.cpu} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-xs font-mono text-muted-foreground mb-1">
                    <span>Память</span>
                    <span>{n.memory.toFixed(1)}%</span>
                  </div>
                  <Progress value={n.memory} className="h-2" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-xs font-mono text-muted-foreground">
                    Аптайм: {Math.round(n.uptimeHours)} ч
                  </div>
                  <Can scope="server:restart">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onRestart(n.id)}
                      disabled={n.status === "restarting" || restart.isPending}
                    >
                      <RefreshCw className="w-3.5 h-3.5 mr-2" />
                      Перезапустить
                    </Button>
                  </Can>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
