import { useEffect, useState } from "react";
import {
  useAdminListCodeFiles,
  useAdminUpdateCodeFile,
  getAdminListCodeFilesQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Code as CodeIcon, Save, Loader2, FileText } from "lucide-react";
import { Can } from "@/lib/auth";
import { toast } from "sonner";

export default function AdminCode() {
  const qc = useQueryClient();
  const { data: files = [], isLoading } = useAdminListCodeFiles();
  const update = useAdminUpdateCodeFile();
  const [selected, setSelected] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    if (!selected && files.length) setSelected((files[0] as any).path);
  }, [files, selected]);

  const current = files.find((f: any) => f.path === selected);
  useEffect(() => {
    setDraft(current?.content ?? "");
  }, [current?.path]);

  const save = () => {
    if (!current) return;
    update.mutate(
      { data: { path: current.path, content: draft, language: current.language } } as any,
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getAdminListCodeFilesQueryKey() });
          toast.success("Файл сохранён");
        },
        onError: (e: any) => toast.error(e?.message ?? "Ошибка"),
      },
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <CodeIcon className="w-7 h-7" /> Редактор конфигов
        </h1>
        <p className="text-muted-foreground mt-1">
          Конфигурационные файлы и шаблоны без перевыпуска сборки.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-[280px_1fr]">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-base">Файлы ({files.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 flex justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
              </div>
            ) : (
              <div className="divide-y divide-border">
                {files.map((f: any) => (
                  <button
                    key={f.path}
                    onClick={() => setSelected(f.path)}
                    className={`w-full flex items-start gap-2 px-4 py-3 text-left text-sm hover:bg-muted/50 ${
                      selected === f.path ? "bg-primary/10" : ""
                    }`}
                  >
                    <FileText className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="font-mono text-xs truncate">{f.path}</div>
                      <Badge variant="outline" className="font-mono text-[10px] mt-1">
                        {f.language}
                      </Badge>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base font-mono truncate">
              {current?.path ?? "—"}
            </CardTitle>
            <Can scope="code:edit">
              <Button onClick={save} disabled={!current || update.isPending}>
                {update.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Сохранить
              </Button>
            </Can>
          </CardHeader>
          <CardContent>
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="font-mono text-xs min-h-[60vh] bg-black/30 border-border"
              spellCheck={false}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
