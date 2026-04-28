import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useLoginUser, getGetCurrentUserQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import { Logo } from "@/components/logo";

const formSchema = z.object({
  hubId: z.string().min(3, "Hub ID должен содержать минимум 3 символа"),
  password: z.string().min(6, "Пароль должен содержать минимум 6 символов"),
});

export default function Login() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const loginMutation = useLoginUser();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      hubId: "",
      password: "",
    },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    loginMutation.mutate(
      { data },
      {
        onSuccess: (session) => {
          queryClient.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() });
          toast.success("Успешный вход");
          if (session.user.role === "buyer") setLocation("/search");
          else if (session.user.role === "seller") setLocation("/dashboard");
          else setLocation("/admin");
        },
        onError: (err: any) => {
          toast.error(err.message || "Ошибка входа");
        }
      }
    );
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md p-8 rounded-xl border border-border bg-card shadow-lg">
        <div className="flex flex-col items-center mb-8 text-center">
          <Link href="/">
            <Logo className="w-12 h-12 rounded-md mb-4 cursor-pointer" />
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Вход в Hub ID</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Единая учетная запись для всех сервисов PriceHub
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="hubId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-mono text-xs uppercase text-muted-foreground">Hub ID</FormLabel>
                  <FormControl>
                    <Input placeholder="username" className="h-12 font-mono bg-background/50" {...field} />
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

            <Button type="submit" className="w-full h-12 text-base font-mono bg-primary hover:bg-primary/90 text-primary-foreground" disabled={loginMutation.isPending}>
              {loginMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Войти"}
            </Button>
          </form>
        </Form>

        <div className="mt-8 text-center text-sm text-muted-foreground">
          Нет аккаунта?{" "}
          <Link href="/register">
            <span className="text-primary hover:underline cursor-pointer">Создать Hub ID</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
