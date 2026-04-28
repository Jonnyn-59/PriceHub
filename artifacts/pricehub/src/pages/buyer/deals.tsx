import { useGetFeaturedDeals } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Flame } from "lucide-react";

export default function Deals() {
  const { data: deals, isLoading } = useGetFeaturedDeals();

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-red-500/10 rounded-xl">
          <Flame className="w-8 h-8 text-red-500" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Горячие скидки</h1>
          <p className="text-muted-foreground">Самые выгодные предложения с маркетплейсов за последние 24 часа</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : !deals?.length ? (
        <div className="text-center py-20 border border-dashed rounded-xl bg-card/50">
          <Flame className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2">Пока нет активных скидок</h3>
          <p className="text-muted-foreground">Загляните позже, мы постоянно обновляем предложения</p>
        </div>
      ) : (
        <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
          {deals.map(deal => (
            <Link key={deal.id} href={`/listing/${deal.id}`}>
              <Card className="break-inside-avoid hover:border-red-500/50 transition-all cursor-pointer overflow-hidden group">
                <div className="relative bg-muted p-6 flex items-center justify-center">
                  <img 
                    src={deal.imageUrl} 
                    alt={deal.name} 
                    className="w-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500" 
                  />
                  {deal.savingsPercent && (
                    <Badge className="absolute top-4 right-4 bg-red-500 hover:bg-red-600 text-white font-mono text-lg px-3 py-1 shadow-lg">
                      -{deal.savingsPercent}%
                    </Badge>
                  )}
                </div>
                <CardContent className="p-5">
                  <div className="text-xs text-muted-foreground font-mono mb-2">{deal.category}</div>
                  <h3 className="font-bold text-lg mb-4 leading-tight">{deal.name}</h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-black font-mono text-red-500">
                        {new Intl.NumberFormat('ru-RU').format(deal.lowestPrice)} ₽
                      </div>
                      <div className="text-sm text-muted-foreground line-through font-mono">
                        {new Intl.NumberFormat('ru-RU').format(deal.highestPrice)} ₽
                      </div>
                    </div>
                    <Badge variant="outline" className="font-mono uppercase">{deal.offers[0]?.marketplace}</Badge>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
