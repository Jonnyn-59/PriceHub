import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  useGetProfileSettings, 
  useUpdateProfileSettings, 
  useGetPreferences, 
  useUpdatePreferences,
  getGetProfileSettingsQueryKey,
  getGetPreferencesQueryKey,
  getGetCurrentUserQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2, Palette, UserCircle } from "lucide-react";

const profileSchema = z.object({
  displayName: z.string().min(2, "Минимум 2 символа"),
  email: z.string().email("Неверный email").optional().or(z.literal("")),
  bio: z.string().max(500).optional().or(z.literal("")),
  company: z.string().optional().or(z.literal("")),
  avatarUrl: z.string().url("Неверный URL").optional().or(z.literal("")),
});

const prefsSchema = z.object({
  theme: z.enum(["light", "dark", "system"]),
  accent: z.string(),
  density: z.enum(["compact", "comfortable"]),
  language: z.enum(["ru", "en"]),
  notifications: z.boolean(),
});

export default function Settings() {
  const qc = useQueryClient();
  const { data: profile, isLoading: profileLoading } = useGetProfileSettings();
  const { data: prefs, isLoading: prefsLoading } = useGetPreferences();
  
  const updateProfile = useUpdateProfileSettings();
  const updatePrefs = useUpdatePreferences();

  const profileForm = useForm<z.infer<typeof profileSchema>>({ resolver: zodResolver(profileSchema) });
  const prefsForm = useForm<z.infer<typeof prefsSchema>>({ resolver: zodResolver(prefsSchema) });

  useEffect(() => {
    if (profile) {
      profileForm.reset({
        displayName: profile.displayName || "",
        email: profile.email || "",
        bio: profile.bio || "",
        company: profile.company || "",
        avatarUrl: profile.avatarUrl || "",
      });
    }
  }, [profile, profileForm]);

  useEffect(() => {
    if (prefs) {
      prefsForm.reset({
        theme: prefs.theme as any,
        accent: prefs.accent || "violet",
        density: prefs.density as any,
        language: prefs.language as any,
        notifications: prefs.notifications ?? true,
      });
    }
  }, [prefs, prefsForm]);

  const onProfileSubmit = (data: z.infer<typeof profileSchema>) => {
    updateProfile.mutate({ data }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getGetProfileSettingsQueryKey() });
        qc.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() });
        toast.success("Профиль обновлен");
      },
      onError: (err: any) => toast.error(err.message)
    });
  };

  const onPrefsSubmit = (data: z.infer<typeof prefsSchema>) => {
    updatePrefs.mutate({ data }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getGetPreferencesQueryKey() });
        toast.success("Настройки внешнего вида сохранены");
        
        // Apply theme immediately
        const isDark = data.theme === 'dark' || (data.theme === 'system' && window.matchMatchMedia?.('(prefers-color-scheme: dark)').matches);
        document.documentElement.classList.toggle('dark', isDark);
        
        // Custom hack to map accent to primary var
        const accents: Record<string, string> = {
          violet: "260 85% 60%",
          indigo: "243 75% 59%",
          cyan: "190 90% 50%",
          emerald: "160 70% 45%",
          rose: "340 80% 60%",
        };
        if (accents[data.accent]) {
          document.documentElement.style.setProperty('--primary', accents[data.accent]);
          document.documentElement.style.setProperty('--ring', accents[data.accent]);
        }
      },
      onError: (err: any) => toast.error(err.message)
    });
  };

  if (profileLoading || prefsLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Настройки</h1>
        <p className="text-muted-foreground mt-1">Управляйте своим профилем и внешним видом приложения</p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
          <TabsTrigger value="profile"><UserCircle className="w-4 h-4 mr-2" /> Профиль</TabsTrigger>
          <TabsTrigger value="appearance"><Palette className="w-4 h-4 mr-2" /> Внешний вид</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6 border border-border rounded-xl p-6 bg-card">
          <Form {...profileForm}>
            <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6 max-w-xl">
              <div className="flex items-center gap-6 mb-8">
                <div className="w-20 h-20 rounded-full bg-muted border border-border flex items-center justify-center overflow-hidden shrink-0">
                  {profileForm.watch("avatarUrl") ? (
                    <img src={profileForm.watch("avatarUrl")} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <UserCircle className="w-10 h-10 text-muted-foreground" />
                  )}
                </div>
                <FormField control={profileForm.control} name="avatarUrl" render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>URL аватара</FormLabel>
                    <FormControl><Input placeholder="https://..." {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <FormField control={profileForm.control} name="displayName" render={({ field }) => (
                <FormItem>
                  <FormLabel>Имя (Отображаемое)</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              
              <FormField control={profileForm.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl><Input type="email" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={profileForm.control} name="company" render={({ field }) => (
                <FormItem>
                  <FormLabel>Компания</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={profileForm.control} name="bio" render={({ field }) => (
                <FormItem>
                  <FormLabel>О себе</FormLabel>
                  <FormControl><Textarea className="resize-none" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <Button type="submit" disabled={updateProfile.isPending}>
                {updateProfile.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Сохранить профиль
              </Button>
            </form>
          </Form>
        </TabsContent>

        <TabsContent value="appearance" className="mt-6 border border-border rounded-xl p-6 bg-card">
          <Form {...prefsForm}>
            <form onSubmit={prefsForm.handleSubmit(onPrefsSubmit)} className="space-y-8 max-w-xl">
              
              <FormField control={prefsForm.control} name="theme" render={({ field }) => (
                <FormItem>
                  <FormLabel>Цветовая тема</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Тема" /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="dark">Темная</SelectItem>
                      <SelectItem value="light">Светлая</SelectItem>
                      <SelectItem value="system">Системная</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={prefsForm.control} name="accent" render={({ field }) => (
                <FormItem>
                  <FormLabel>Акцентный цвет</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Цвет" /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="violet">Фиолетовый (PriceHub)</SelectItem>
                      <SelectItem value="indigo">Индиго</SelectItem>
                      <SelectItem value="cyan">Циан</SelectItem>
                      <SelectItem value="emerald">Изумрудный</SelectItem>
                      <SelectItem value="rose">Розовый</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={prefsForm.control} name="density" render={({ field }) => (
                <FormItem>
                  <FormLabel>Плотность интерфейса</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Плотность" /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="comfortable">Комфортная</SelectItem>
                      <SelectItem value="compact">Компактная</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={prefsForm.control} name="language" render={({ field }) => (
                <FormItem>
                  <FormLabel>Язык</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Язык" /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="ru">Русский</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={prefsForm.control} name="notifications" render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Push-уведомления</FormLabel>
                    <FormDescription>Получать системные уведомления в браузере</FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )} />

              <Button type="submit" disabled={updatePrefs.isPending}>
                {updatePrefs.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Применить изменения
              </Button>
            </form>
          </Form>
        </TabsContent>
      </Tabs>
    </div>
  );
}
