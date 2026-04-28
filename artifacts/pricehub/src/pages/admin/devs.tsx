import { useState } from "react";
import {
  useAdminListDevelopers,
  useAdminCreateDeveloper,
  useAdminUpdateDevPermissions,
  getAdminListDevelopersQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, ShieldCheck, KeyRound, Loader2 } from "lucide-react";
import { Can } from "@/lib/auth";
import { toast } from "sonner";

const ALL_SCOPES = [
  "users:view",
  "users:edit",
  "users:ban",
  "users:delete",
  "products:view",
  "products:edit",
  "products:delete",
  "devs:create",
  "devs:edit",
  "server:view",
  "server:restart",
  "code:view",
  "code:edit",
  "console:view",
  "audit:view",
  "history:view",
];

export default function AdminDevs() {
  const qc = useQueryClient();
  const { data: devs = [], isLoading } = useAdminListDevelopers();
  const create = useAdminCreateDeveloper();
  const updatePerms = useAdminUpdateDevPermissions();

  const [openCreate, setOpenCreate] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editPerms, setEditPerms] = useState<string[]>([]);
  const [form, setForm] = useState({
    hubId: "",
    password: "",
    displayName: "",
    email: "",
    role: "developer",
    permissions: [...ALL_SCOPES] as string[],
  });

  const togglePerm = (perm: string, list: string[], setList: (v: string[]) => void) => {
    setList(list.includes(perm) ? list.filter((p) => p !== perm) : [...list, perm]);
  };

  const submitCreate = () => {
    if (!form.hubId || !form.password || !form.displayName) {
      toast.error("Заполните Hub ID, имя и пароль");
      return;
    }
    create.mutate(
      { data: form } as any,
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getAdminListDevelopersQueryKey() });
          toast.success("Аккаунт создан");
          setOpenCreate(false);
          setForm({ hubId: "", password: "", displayName: "", email: "", role: "developer", permissions: [...ALL_SCOPES] });
        },
        onError: (e: any) => toast.error(e?.message ?? "Ошибка"),
      },
    );
  };

  const submitPerms = () => {
    if (!editingId) return;
    updatePerms.mutate(
      { id: editingId, data: { permissions: editPerms } } as any,
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getAdminListDevelopersQueryKey() });
          toast.success("Права обновлены");
          setEditingId(null);
        },
        onError: (e: any) => toast.error(e?.message ?? "Ошибка"),
      },
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Разработчики и поддержка</h1>
          <p className="text-muted-foreground mt-1">Внутренние аккаунты с расширенными правами.</p>
        </div>
        <Can scope="devs:create">
          <Dialog open={openCreate} onOpenChange={setOpenCreate}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" /> Создать разработчика
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Новый внутренний аккаунт</DialogTitle>
                <DialogDescription>
                  Создаётся аккаунт уровня developer или support с выбранными правами.
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Hub ID</Label>
                  <Input
                    placeholder="username"
                    value={form.hubId}
                    onChange={(e) => setForm({ ...form, hubId: e.target.value })}
                    className="font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Пароль</Label>
                  <Input
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Отображаемое имя</Label>
                  <Input
                    value={form.displayName}
                    onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>Роль</Label>
                  <Select
                    value={form.role}
                    onValueChange={(v) => setForm({ ...form, role: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="developer">developer</SelectItem>
                      <SelectItem value="support">support</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>Права доступа</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-3 rounded-md border bg-card/50 max-h-60 overflow-auto">
                    {ALL_SCOPES.map((scope) => (
                      <label
                        key={scope}
                        className="flex items-center gap-2 text-sm font-mono cursor-pointer"
                      >
                        <Checkbox
                          checked={form.permissions.includes(scope)}
                          onCheckedChange={() =>
                            togglePerm(scope, form.permissions, (v) =>
                              setForm({ ...form, permissions: v }),
                            )
                          }
                        />
                        {scope}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpenCreate(false)}>
                  Отмена
                </Button>
                <Button onClick={submitCreate} disabled={create.isPending}>
                  {create.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Создать
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </Can>
      </div>

      {isLoading ? (
        <div className="py-12 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {devs.map((d: any) => (
            <Card key={d.id} className="overflow-hidden">
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <CardTitle className="text-base truncate">{d.displayName}</CardTitle>
                    <div className="text-xs font-mono text-muted-foreground mt-1 truncate">
                      {d.hubId}
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={`font-mono ${d.role === "developer" ? "text-primary border-primary/40" : ""}`}
                  >
                    {d.role}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-1">
                  {(d.permissions ?? []).slice(0, 8).map((p: string) => (
                    <Badge key={p} variant="secondary" className="font-mono text-[10px]">
                      {p}
                    </Badge>
                  ))}
                  {(d.permissions?.length ?? 0) > 8 && (
                    <Badge variant="outline" className="font-mono text-[10px]">
                      +{d.permissions.length - 8}
                    </Badge>
                  )}
                </div>
                <Can scope="devs:edit">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      setEditingId(d.id);
                      setEditPerms(d.permissions ?? []);
                    }}
                  >
                    <KeyRound className="w-4 h-4 mr-2" />
                    Изменить права
                  </Button>
                </Can>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={editingId !== null} onOpenChange={(o) => !o && setEditingId(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              Права доступа
            </DialogTitle>
            <DialogDescription>Выберите разрешённые операции.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-2 max-h-72 overflow-auto p-3 rounded-md border bg-card/50">
            {ALL_SCOPES.map((scope) => (
              <label
                key={scope}
                className="flex items-center gap-2 text-sm font-mono cursor-pointer"
              >
                <Checkbox
                  checked={editPerms.includes(scope)}
                  onCheckedChange={() => togglePerm(scope, editPerms, setEditPerms)}
                />
                {scope}
              </label>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingId(null)}>
              Отмена
            </Button>
            <Button onClick={submitPerms} disabled={updatePerms.isPending}>
              {updatePerms.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
