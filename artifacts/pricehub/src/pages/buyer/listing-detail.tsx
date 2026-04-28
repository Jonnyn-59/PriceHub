import { useRoute } from "wouter";
import { useGetListing } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Loader2, ExternalLink, Star, Truck } from "lucide-react";
import { Link } from "wouter";

export default function ListingDetail() {
  const [, params] = useRoute("/listing/:id");
  const id = params?.id ? parseInt(params.id, 10) : 0;

  const { data: listing, isLoading } = useGetListing(id, { 
    query: { enabled: !!id } 
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold mb-2">Товар не найден</h2>
        <Link href="/search">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" /> Вернуться к поиску
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <Link href="/search">
        <Button variant="ghost" size="sm" className="mb-2">
          <ArrowLeft className="w-4 h-4 mr-2" /> Назад
        </Button>
      </Link>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-card rounded-2xl p-8 border border-border flex items-center justify-center aspect-square">
          <img src={listing.imageUrl} alt={listing.name} className="w-full h-full object-contain mix-blend-multiply" />
        </div>

        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="font-mono text-xs">{listing.category}</Badge>
              {listing.brand && <Badge className="font-mono text-xs bg-primary/20 text-primary hover:bg-primary/30">{listing.brand}</Badge>}
            </div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">{listing.name}</h1>
            {listing.description && <p className="text-muted-foreground leading-relaxed">{listing.description}</p>}
          </div>

          <div className="p-6 bg-muted/30 rounded-xl border border-border space-y-4">
            <div className="flex justify-between items-end">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Лучшая цена</div>
                <div className="text-4xl font-bold font-mono text-primary">
                  {new Intl.NumberFormat('ru-RU').format(listing.lowestPrice)} ₽
                </div>
              </div>
              {listing.savingsPercent && listing.savingsPercent > 0 && (
                <div className="text-right">
                  <Badge variant="destructive" className="text-lg px-3 py-1 font-mono">
                    Выгода {listing.savingsPercent}%
                  </Badge>
                  <div className="text-sm text-muted-foreground mt-1 line-through font-mono">
                    {new Intl.NumberFormat('ru-RU').format(listing.highestPrice)} ₽
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4 pt-8 border-t border-border">
        <h2 className="text-2xl font-bold tracking-tight">Предложения магазинов</h2>
        
        <div className="border border-border rounded-xl overflow-hidden bg-card">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="font-mono">Маркетплейс</TableHead>
                <TableHead className="font-mono">Цена</TableHead>
                <TableHead className="font-mono">Доставка</TableHead>
                <TableHead className="font-mono">Рейтинг</TableHead>
                <TableHead className="text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {listing.offers.sort((a, b) => a.price - b.price).map((offer, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium text-primary">
                    {offer.marketplace}
                  </TableCell>
                  <TableCell className="text-lg font-bold font-mono">
                    {new Intl.NumberFormat('ru-RU').format(offer.price)} ₽
                  </TableCell>
                  <TableCell>
                    {offer.deliveryDays ? (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Truck className="w-4 h-4 mr-1" /> {offer.deliveryDays} дн.
                      </div>
                    ) : "-"}
                  </TableCell>
                  <TableCell>
                    {offer.rating ? (
                      <div className="flex items-center text-sm text-amber-500">
                        <Star className="w-4 h-4 mr-1 fill-current" /> {offer.rating}
                      </div>
                    ) : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild size="sm" className="font-mono">
                      <a href={offer.url} target="_blank" rel="noreferrer">
                        В магазин <ExternalLink className="w-4 h-4 ml-2" />
                      </a>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
