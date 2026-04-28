import { useMemo, useState } from "react";
import { useAdminGetAuditLog } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Activity } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

export default function AdminAudit() {
  const { data: rows = [], isLoading } = useAdminGetAuditLog();
  const [filter, setFilter] = useState("");

  const filtered = useMemo(() => {
    const f = filter.trim().toLowerCase();
    if (!f) return rows;
    return rows.filter(
      (r: any) =>
        r.actorName.toLowerCase().includes(f) ||
        r.action.toLowerCase().includes(f) ||
        r.target.toLowerCase().includes(f),
    );
  }, [rows, filter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Activity className="w-7 h-7" /> Аудит
          </h1>
          <p className="text-muted-foreground mt-1">История значимых действий в системе.</p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Фильтр: actor, action, target"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="pl-9 font-mono"
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">
            Записей: <span className="font-mono">{filtered.length}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Время</TableHead>
                <TableHead>Кто</TableHead>
                <TableHead>Действие</TableHead>
                <TableHead>Цель</TableHead>
                <TableHead>Детали</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    Загрузка…
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    Нет записей
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((r: any) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-xs whitespace-nowrap text-muted-foreground">
                      {format(new Date(r.createdAt), "dd MMM HH:mm:ss", { locale: ru })}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-sm">{r.actorName}</div>
                      <div className="text-xs font-mono text-muted-foreground">{r.actorRole}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono">
                        {r.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{r.target}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground max-w-md truncate">
                      {r.details ?? "—"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
