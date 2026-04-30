import { useState } from "react";
import { motion } from "framer-motion";
import {
  useListSellerStaff,
  useCreateSellerStaff,
  useDeleteSellerStaff,
  getListSellerStaffQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Trash2, Plus, UserPlus, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function SellerStaff() {
  const { data: staff, isLoading } = useListSellerStaff();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ hubId: "", password: "", displayName: "", email: "", jobTitle: "" });

  const createMut = useCreateSellerStaff({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListSellerStaffQueryKey() });
        setOpen(false);
        setForm({ hubId: "", password: "", displayName: "", email: "", jobTitle: "" });
        toast({ title: "Сотрудник добавлен" });
      },
      onError: (e: unknown) => {
        const msg = e instanceof Error ? e.message : "Не удалось создать";
        toast({ title: "Ошибка", description: msg, variant: "destructive" });
      },
    },
  });

  const deleteMut = useDeleteSellerStaff({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListSellerStaffQueryKey() });
        toast({ title: "Сотрудник удалён" });
      },
    },
  });

  const handleCreate = () => {
    if (!form.hubId || !form.password || !form.displayName || !form.jobTitle) {
      toast({ title: "Заполните все обязательные поля", variant: "destructive" });
      return;
    }
    createMut.mutate({ data: form });
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Сотрудники</h1>
          <p className="text-muted-foreground mt-1">
            Создавайте аккаунты для своей команды. Они увидят те же товары и аналитику.
          </p>
        </div>
        <Button onClick={() => setOpen((v) => !v)} className="rounded-full" data-testid="button-toggle-staff-form">
          <Plus className="w-4 h-4 mr-2" /> {open ? "Скрыть форму" : "Добавить сотрудника"}
        </Button>
      </motion.div>

      {open && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-primary" /> Новый сотрудник
              </CardTitle>
              <CardDescription>Сотрудник получит роль продавца с привязкой к вашему аккаунту.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Hub ID *</Label>
                <Input
                  value={form.hubId}
                  onChange={(e) => setForm({ ...form, hubId: e.target.value })}
                  placeholder="employee_login"
                  data-testid="input-staff-hubid"
                />
              </div>
              <div className="space-y-2">
                <Label>Пароль *</Label>
                <Input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Минимум 6 символов"
                  data-testid="input-staff-password"
                />
              </div>
              <div className="space-y-2">
                <Label>Имя *</Label>
                <Input
                  value={form.displayName}
                  onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                  placeholder="Иван Петров"
                  data-testid="input-staff-name"
                />
              </div>
              <div className="space-y-2">
                <Label>Должность *</Label>
                <Input
                  value={form.jobTitle}
                  onChange={(e) => setForm({ ...form, jobTitle: e.target.value })}
                  placeholder="Менеджер по продажам"
                  data-testid="input-staff-title"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="employee@company.ru"
                  data-testid="input-staff-email"
                />
              </div>
              <div className="md:col-span-2 flex justify-end">
                <Button
                  onClick={handleCreate}
                  disabled={createMut.isPending}
                  className="rounded-full"
                  data-testid="button-create-staff"
                >
                  {createMut.isPending ? "Создание..." : "Создать аккаунт"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" /> Команда ({staff?.length ?? 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-muted-foreground py-8 text-center">Загрузка...</div>
          ) : !staff || staff.length === 0 ? (
            <div className="text-muted-foreground py-8 text-center">
              Пока нет сотрудников. Добавьте первого, чтобы делегировать задачи.
            </div>
          ) : (
            <div className="space-y-2">
              {staff.map((s, idx) => (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/40 transition-colors"
                  data-testid={`row-staff-${s.id}`}
                >
                  <div className="flex items-center gap-4">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {s.displayName.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{s.displayName}</div>
                      <div className="text-sm text-muted-foreground font-mono">@{s.hubId}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="rounded-full">
                      {s.jobTitle ?? "Сотрудник"}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive rounded-full"
                      onClick={() => deleteMut.mutate({ id: s.id })}
                      disabled={deleteMut.isPending}
                      data-testid={`button-delete-staff-${s.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
