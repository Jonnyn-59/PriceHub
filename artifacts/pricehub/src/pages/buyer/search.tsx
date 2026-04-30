import { useState } from "react";
import { useSearchMarketplace } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search as SearchIcon, Loader2, ArrowRight } from "lucide-react";

export default function Search() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("");

  const { data: results, isLoading } = useSearchMarketplace({
    q: query,
    category: activeCategory || undefined,
  }, { query: { enabled: true } as never });

  const categories = ["Электроника", "Бытовая техника", "Одежда", "Дом"];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Поиск товаров</h1>
        
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input 
              placeholder="Найти телефон, кроссовки..." 
              className="pl-10 h-12 text-lg font-mono bg-card"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </form>

        <div className="flex flex-wrap gap-2">
          <Button 
            variant={activeCategory === "" ? "default" : "outline"} 
            size="sm"
            onClick={() => setActiveCategory("")}
            className="font-mono"
          >
            Все
          </Button>
          {categories.map(cat => (
            <Button 
              key={cat}
              variant={activeCategory === cat ? "default" : "outline"} 
              size="sm"
              onClick={() => setActiveCategory(cat)}
              className="font-mono"
            >
              {cat}
            </Button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : !results?.length ? (
        <div className="text-center py-20 border border-dashed rounded-xl bg-card/50">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <SearchIcon className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-2">Ничего не найдено</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Попробуйте изменить запрос или выбрать другую категорию
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {results.map(item => (
            <Link key={item.id} href={`/listing/${item.id}`}>
              <Card className="hover:border-primary/50 transition-colors cursor-pointer overflow-hidden h-full flex flex-col">
                <div className="aspect-square bg-muted relative p-4 flex items-center justify-center">
                  <img src={item.imageUrl} alt={item.name} className="object-contain w-full h-full mix-blend-multiply" />
                  {item.savingsPercent && item.savingsPercent > 0 && (
                    <Badge className="absolute top-2 right-2 bg-destructive hover:bg-destructive text-destructive-foreground font-mono">
                      -{item.savingsPercent}%
                    </Badge>
                  )}
                </div>
                <CardContent className="p-4 flex-1 flex flex-col">
                  <div className="text-xs text-muted-foreground font-mono mb-1">{item.category}</div>
                  <h3 className="font-medium line-clamp-2 mb-4 flex-1">{item.name}</h3>
                  
                  <div className="space-y-2 mt-auto">
                    <div className="flex items-end justify-between">
                      <div className="text-sm text-muted-foreground">От</div>
                      <div className="text-lg font-bold font-mono">
                        {new Intl.NumberFormat('ru-RU').format(item.lowestPrice)} ₽
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      {item.offers.slice(0, 3).map((offer, i) => (
                        <div key={i} className="flex items-center justify-between text-xs p-1.5 bg-muted/50 rounded">
                          <span className="font-medium text-primary">{offer.marketplace}</span>
                          <span className="font-mono">{new Intl.NumberFormat('ru-RU').format(offer.price)} ₽</span>
                        </div>
                      ))}
                    </div>
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
