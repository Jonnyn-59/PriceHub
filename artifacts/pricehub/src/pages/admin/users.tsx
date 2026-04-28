import { useState, useMemo } from "react";
import {
  useAdminListUsers,
  useAdminUpdateUser,
  useAdminDeleteUser,
  getAdminListUsersQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, Trash2, Loader2, Link as LinkIcon } from "lucide-react";
import { Can } from "@/lib/auth";
import { Link } from "wouter";
import { toast } from "sonner";

export default function AdminUsers() {
  const qc = useQueryClient();
  const { data: users = [], isLoading } = useAdminListUsers();
  const update = useAdminUpdateUser();
  const del = useAdminDeleteUser();
  const [filter, setFilter] = useState("");

  const filtered = useMemo(() => {
    const f = filter.trim().toLowerCase();
    if (!f) return users;
    return users.filter(
      (u: any) =>
        u.hubId.toLowerCase().includes(f) ||
        u.displayName.toLowerCase().includes(f) ||
        (u.email ?? "").toLowerCase().includes(f),
    );
  }, [users, filter]);

  const onUpdate = (id: number, data: Record<string, unknown>) => {
    update.mutate(
      { id, data } as any,
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getAdminListUsersQueryKey() });
          toast.success("Изменения сохранены");
        },
        onError: (e: any) => toast.error(e?.message ?? "Ошибка"),
      },
    );
  };

  const onDelete = (id: number) => {
    del.mutate(
      { id } as any,
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getAdminListUsersQueryKey() });
          toast.success("Пользователь удалён");
        },
        onError: (e: any) => toast.error(e?.message ?? "Ошибка"),
      },
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Пользователи</h1>
          <p className="text-muted-foreground mt-1">Управление аккаунтами PriceHub.</p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Поиск по Hub ID или имени"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="pl-9 font-mono"
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">
            Всего: <span className="font-mono">{filtered.length}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {isLoading ? (
            <div className="py-12 flex justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Пользователь</TableHead>
                  <TableHead>Роль</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Тариф</TableHead>
                  <TableHead className="text-center">Заблокирован</TableHead>
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((u: any) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {u.displayName.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="font-medium truncate">{u.displayName}</div>
                          <div className="text-xs text-muted-foreground font-mono truncate">
                            {u.hubId}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Can scope="users:edit">
                        <Select
                          value={u.role}
                          onValueChange={(v) => onUpdate(u.id, { role: v })}
                        >
                          <SelectTrigger className="w-36 font-mono">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="buyer">buyer</SelectItem>
                            <SelectItem value="seller">seller</SelectItem>
                            <SelectItem value="support">support</SelectItem>
                            <SelectItem value="developer">developer</SelectItem>
                          </SelectContent>
                        </Select>
                      </Can>
                      {!u.permissions?.includes("users:edit") && (
                        <Badge variant="outline" className="font-mono">{u.role}</Badge>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {u.email ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-mono uppercase">
                        {u.subscriptionTier}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Can scope="users:ban">
                        <Switch
                          checked={u.banned}
                          onCheckedChange={(v) => onUpdate(u.id, { banned: v })}
                        />
                      </Can>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {u.role === "seller" && (
                          <Link href={`/admin/seller-history/${u.id}`}>
                            <Button variant="ghost" size="icon" title="История продавца">
                              <LinkIcon className="w-4 h-4" />
                            </Button>
                          </Link>
                        )}
                        <Can scope="users:delete">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-destructive">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Удалить пользователя?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Это действие необратимо. Будут удалены {u.hubId} и связанные сессии.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Отмена</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => onDelete(u.id)}
                                  className="bg-destructive text-destructive-foreground"
                                >
                                  Удалить
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </Can>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
