import { useState } from "react";
import { useListMyProducts, useDeleteProduct, useUpdateProduct, useCreateProduct, getListMyProductsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Save, Image as ImageIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const formSchema = z.object({
  name: z.string().min(2, "Минимум 2 символа"),
  marketplace: z.string().min(1, "Выберите маркетплейс"),
  category: z.string().optional(),
  price: z.coerce.number().min(1, "Цена обязательна"),
  cost: z.coerce.number().min(0, "Себестоимость обязательна"),
  stock: z.coerce.number().min(0, "Остаток обязателен"),
  imageUrl: z.string().url("Неверный URL").optional().or(z.literal("")),
});

export default function Products() {
  const qc = useQueryClient();
  const { data: products, isLoading } = useListMyProducts();
  const deleteProduct = useDeleteProduct();
  const updateProduct = useUpdateProduct();
  const createProduct = useCreateProduct();
  
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editPrice, setEditPrice] = useState<string>("");
  const [isAddOpen, setIsAddOpen] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      marketplace: "OZON",
      price: 0,
      cost: 0,
      stock: 0,
      imageUrl: "",
    },
  });

  const handleDelete = (id: number) => {
    if (confirm("Точно удалить товар?")) {
      deleteProduct.mutate({ id }, {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getListMyProductsQueryKey() });
          toast.success("Товар удален");
        }
      });
    }
  };

  const handleStartEdit = (id: number, currentPrice: number) => {
    setEditingId(id);
    setEditPrice(currentPrice.toString());
  };

  const handleSaveEdit = (id: number) => {
    const price = Number(editPrice);
    if (isNaN(price) || price <= 0) {
      toast.error("Некорректная цена");
      return;
    }
    
    updateProduct.mutate({ id, data: { price } }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListMyProductsQueryKey() });
        setEditingId(null);
        toast.success("Цена обновлена");
      }
    });
  };

  const onSubmitAdd = (data: z.infer<typeof formSchema>) => {
    createProduct.mutate({ data }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListMyProductsQueryKey() });
        setIsAddOpen(false);
        form.reset();
        toast.success("Товар добавлен");
      },
      onError: (err: any) => toast.error(err.message)
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Мои товары</h1>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="font-mono">
              <Plus className="w-4 h-4 mr-2" /> Добавить товар
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Новый товар</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmitAdd)} className="space-y-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem><FormLabel>Название</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage/></FormItem>
                )} />
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="marketplace" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Маркетплейс</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Выберите" /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="OZON">OZON</SelectItem>
                          <SelectItem value="WILDBERRIES">WILDBERRIES</SelectItem>
                          <SelectItem value="YANDEX">ЯНДЕКС</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage/>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="category" render={({ field }) => (
                    <FormItem><FormLabel>Категория</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage/></FormItem>
                  )} />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <FormField control={form.control} name="price" render={({ field }) => (
                    <FormItem><FormLabel>Цена (₽)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage/></FormItem>
                  )} />
                  <FormField control={form.control} name="cost" render={({ field }) => (
                    <FormItem><FormLabel>Себестоимость</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage/></FormItem>
                  )} />
                  <FormField control={form.control} name="stock" render={({ field }) => (
                    <FormItem><FormLabel>Остаток</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage/></FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="imageUrl" render={({ field }) => (
                  <FormItem><FormLabel>URL изображения (опц.)</FormLabel><FormControl><Input placeholder="https://..." {...field} /></FormControl><FormMessage/></FormItem>
                )} />
                <DialogFooter>
                  <Button type="submit" disabled={createProduct.isPending}>
                    {createProduct.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Сохранить"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border border-border rounded-xl bg-card overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-16"></TableHead>
              <TableHead>Название</TableHead>
              <TableHead>Маркетплейс</TableHead>
              <TableHead className="text-right">Цена</TableHead>
              <TableHead className="text-right">Себестоимость</TableHead>
              <TableHead className="text-right">Маржа</TableHead>
              <TableHead className="text-right">Остаток</TableHead>
              <TableHead className="text-right w-16"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={8} className="h-32 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" /></TableCell></TableRow>
            ) : !products?.length ? (
              <TableRow><TableCell colSpan={8} className="h-32 text-center text-muted-foreground">У вас пока нет добавленных товаров</TableCell></TableRow>
            ) : (
              products.map(p => {
                const margin = p.price - p.cost;
                const marginPct = ((margin / p.price) * 100).toFixed(1);
                
                return (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center overflow-hidden border border-border">
                        {p.imageUrl ? <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" /> : <ImageIcon className="w-4 h-4 text-muted-foreground" />}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="line-clamp-2">{p.name}</div>
                      <div className="text-xs text-muted-foreground font-mono">{p.category}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono">{p.marketplace}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono w-48">
                      {editingId === p.id ? (
                        <div className="flex items-center justify-end gap-2">
                          <Input 
                            type="number" 
                            className="h-8 w-24 text-right font-mono" 
                            value={editPrice}
                            onChange={(e) => setEditPrice(e.target.value)}
                            autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit(p.id)}
                          />
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-primary" onClick={() => handleSaveEdit(p.id)}>
                            <Save className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <div 
                          className="cursor-pointer hover:text-primary transition-colors border-b border-dashed border-transparent hover:border-primary inline-block"
                          onClick={() => handleStartEdit(p.id, p.price)}
                        >
                          {new Intl.NumberFormat('ru-RU').format(p.price)} ₽
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono text-muted-foreground">
                      {new Intl.NumberFormat('ru-RU').format(p.cost)} ₽
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      <span className={margin > 0 ? "text-emerald-500" : "text-rose-500"}>{marginPct}%</span>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      <Badge variant={p.stock < 10 ? "destructive" : "secondary"}>{p.stock} шт</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(p.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
