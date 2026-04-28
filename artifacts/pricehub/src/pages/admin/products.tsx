import { useMemo, useState } from "react";
import {
  useAdminListProducts,
  useAdminUpdateProduct,
  useAdminDeleteProduct,
  getAdminListProductsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Search, Trash2, Loader2 } from "lucide-react";
import { Can } from "@/lib/auth";
import { toast } from "sonner";

const fmt = (n: number) => new Intl.NumberFormat("ru-RU").format(Math.round(n)) + " ₽";

export default function AdminProducts() {
  const qc = useQueryClient();
  const { data: products = [], isLoading } = useAdminListProducts();
  const update = useAdminUpdateProduct();
  const del = useAdminDeleteProduct();
  const [filter, setFilter] = useState("");
  const [drafts, setDrafts] = useState<Record<number, { price?: string; stock?: string }>>({});

  const filtered = useMemo(() => {
    const f = filter.trim().toLowerCase();
    if (!f) return products;
    return products.filter(
      (p: any) =>
        p.name.toLowerCase().includes(f) ||
        (p.sellerHubId ?? "").toLowerCase().includes(f) ||
        p.marketplace.toLowerCase().includes(f),
    );
  }, [products, filter]);

  const savePatch = (id: number, data: Record<string, unknown>) =>
    update.mutate(
      { id, data } as any,
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getAdminListProductsQueryKey() });
          toast.success("Сохранено");
          setDrafts((d) => {
            const next = { ...d };
            delete next[id];
            return next;
          });
        },
        onError: (e: any) => toast.error(e?.message ?? "Ошибка"),
      },
    );

  const onDelete = (id: number) =>
    del.mutate(
      { id } as any,
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getAdminListProductsQueryKey() });
          toast.success("Товар удалён");
        },
        onError: (e: any) => toast.error(e?.message ?? "Ошибка"),
      },
    );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Все товары</h1>
          <p className="text-muted-foreground mt-1">Каталог по всем продавцам платформы.</p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Имя товара, продавец, площадка"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">
            Найдено: <span className="font-mono">{filtered.length}</span>
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
                  <TableHead>Товар</TableHead>
                  <TableHead>Продавец</TableHead>
                  <TableHead>Площадка</TableHead>
                  <TableHead className="text-right">Цена</TableHead>
                  <TableHead className="text-right">Себестоимость</TableHead>
                  <TableHead className="text-right">Остаток</TableHead>
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p: any) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="flex items-center gap-3 min-w-0">
                        {p.imageUrl && (
                          <img
                            src={p.imageUrl}
                            alt=""
                            className="w-10 h-10 rounded object-cover bg-muted shrink-0"
                          />
                        )}
                        <div className="min-w-0">
                          <div className="font-medium truncate">{p.name}</div>
                          <div className="text-xs text-muted-foreground truncate">
                            {p.category ?? "—"}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {p.sellerHubId ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-mono">
                        {p.marketplace}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Can scope="products:edit">
                        <Input
                          className="w-28 ml-auto font-mono text-right"
                          defaultValue={p.price}
                          onChange={(e) =>
                            setDrafts((d) => ({
                              ...d,
                              [p.id]: { ...(d[p.id] ?? {}), price: e.target.value },
                            }))
                          }
                          onBlur={() => {
                            const draft = drafts[p.id]?.price;
                            if (draft !== undefined && Number(draft) !== p.price) {
                              savePatch(p.id, { price: Number(draft) });
                            }
                          }}
                        />
                      </Can>
                      {!drafts[p.id] && (
                        <span className="font-mono text-sm">{fmt(p.price)}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono text-muted-foreground text-sm">
                      {fmt(p.cost)}
                    </TableCell>
                    <TableCell className="text-right font-mono">{p.stock}</TableCell>
                    <TableCell className="text-right">
                      <Can scope="products:delete">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Удалить товар?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Товар «{p.name}» будет удалён без возможности восстановления.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Отмена</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => onDelete(p.id)}
                                className="bg-destructive text-destructive-foreground"
                              >
                                Удалить
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </Can>
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
