import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useRegisterUser, getGetCurrentUserQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Logo } from "@/components/logo";
import { RegisterBodyRole } from "@workspace/api-client-react";

const formSchema = z.object({
  hubId: z.string().min(3, "Hub ID должен содержать минимум 3 символа"),
  password: z.string().min(6, "Пароль должен содержать минимум 6 символов"),
  displayName: z.string().min(2, "Имя должно содержать минимум 2 символа"),
  email: z.string().email("Неверный формат email").optional().or(z.literal("")),
  role: z.nativeEnum(RegisterBodyRole),
});

export default function Register() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const registerMutation = useRegisterUser();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      hubId: "",
      password: "",
      displayName: "",
      email: "",
      role: RegisterBodyRole.buyer,
    },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    registerMutation.mutate(
      { data },
      {
        onSuccess: (session) => {
          queryClient.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() });
          toast.success("Регистрация успешна");
          if (session.user.role === "buyer") setLocation("/search");
          else if (session.user.role === "seller") setLocation("/dashboard");
          else setLocation("/admin");
        },
        onError: (err: any) => {
          toast.error(err.message || "Ошибка регистрации");
        }
      }
    );
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md p-8 rounded-xl border border-border bg-card shadow-lg">
        <div className="flex flex-col items-center mb-6 text-center">
          <Link href="/">
            <Logo className="w-12 h-12 rounded-md mb-4 cursor-pointer" />
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Создать Hub ID</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Присоединяйтесь к платформе аналитики PriceHub
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Tabs value={field.value} onValueChange={field.onChange} className="w-full mb-4">
                      <TabsList className="grid w-full grid-cols-2 h-12">
                        <TabsTrigger value={RegisterBodyRole.buyer} className="font-mono text-sm">Покупатель</TabsTrigger>
                        <TabsTrigger value={RegisterBodyRole.seller} className="font-mono text-sm">Продавец</TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="displayName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-mono text-xs uppercase text-muted-foreground">Отображаемое имя</FormLabel>
                  <FormControl>
                    <Input placeholder="Иван Иванов" className="h-12 font-mono bg-background/50" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="hubId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-mono text-xs uppercase text-muted-foreground">Hub ID (логин)</FormLabel>
                  <FormControl>
                    <Input placeholder="username" className="h-12 font-mono bg-background/50" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-mono text-xs uppercase text-muted-foreground">Email (опционально)</FormLabel>
                  <FormControl>
                    <Input placeholder="mail@example.com" type="email" className="h-12 font-mono bg-background/50" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-mono text-xs uppercase text-muted-foreground">Пароль</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" className="h-12 font-mono bg-background/50" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full h-12 text-base font-mono bg-primary hover:bg-primary/90 text-primary-foreground mt-4" disabled={registerMutation.isPending}>
              {registerMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Зарегистрироваться"}
            </Button>
          </form>
        </Form>

        <div className="mt-8 text-center text-sm text-muted-foreground">
          Уже есть Hub ID?{" "}
          <Link href="/login">
            <span className="text-primary hover:underline cursor-pointer">Войти</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
