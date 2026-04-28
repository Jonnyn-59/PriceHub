import { useState } from "react";
import { useListNews } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ExternalLink, Calendar } from "lucide-react";

export default function News() {
  const [activeCategory, setActiveCategory] = useState<string>("");
  const { data: news, isLoading } = useListNews();

  const categories = Array.from(new Set(news?.map(n => n.category) || []));
  const filteredNews = activeCategory ? news?.filter(n => n.category === activeCategory) : news;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Новости площадок</h1>
        <div className="flex flex-wrap gap-2">
          <Button 
            variant={activeCategory === "" ? "default" : "outline"} 
            size="sm"
            onClick={() => setActiveCategory("")}
            className="font-mono"
          >
            Все новости
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
      ) : (
        <div className="space-y-6">
          {filteredNews?.map(item => (
            <Card key={item.id} className="overflow-hidden hover:border-primary/30 transition-colors">
              <div className="flex flex-col md:flex-row">
                {item.imageUrl && (
                  <div className="w-full md:w-64 h-48 md:h-auto bg-muted shrink-0">
                    <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
                <CardContent className="p-6 flex-1 flex flex-col">
                  <div className="flex items-center gap-3 mb-3">
                    <Badge variant="secondary" className="font-mono text-xs">{item.source}</Badge>
                    <Badge variant="outline" className="font-mono text-xs">{item.category}</Badge>
                    <div className="flex items-center text-xs text-muted-foreground ml-auto font-mono">
                      <Calendar className="w-3 h-3 mr-1" />
                      {new Date(item.publishedAt).toLocaleDateString('ru-RU')}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                  <p className="text-muted-foreground mb-4 leading-relaxed flex-1">{item.summary}</p>
                  
                  {item.url && (
                    <div className="mt-auto">
                      <Button variant="link" className="p-0 h-auto font-mono text-primary" asChild>
                        <a href={item.url} target="_blank" rel="noreferrer">Читать в источнике <ExternalLink className="w-3 h-3 ml-1" /></a>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
