import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Logo } from "@/components/logo";
import { ArrowRight, BarChart3, Search, ShieldCheck, Sparkles } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useEffect } from "react";
import { motion } from "framer-motion";

export default function Home() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      if (user.role === "buyer") setLocation("/search");
      else if (user.role === "seller") setLocation("/dashboard");
      else setLocation("/admin");
    }
  }, [user, setLocation]);

  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col">
      <header className="h-20 border-b border-border/50 flex items-center justify-between px-6 lg:px-12 backdrop-blur-sm sticky top-0 z-50 bg-background/80">
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3"
        >
          <Logo className="w-8 h-8 rounded-full" />
          <span className="font-mono font-bold text-xl tracking-tight text-primary">PriceHub</span>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3"
        >
          <Link href="/login">
            <Button variant="ghost" className="font-mono rounded-full">Войти</Button>
          </Link>
          <Link href="/register">
            <Button className="font-mono rounded-full bg-primary hover:bg-primary/90 text-primary-foreground">
              Регистрация
            </Button>
          </Link>
        </motion.div>
      </header>

      <main className="flex-1">
        <section className="relative pt-24 pb-32 lg:pt-36 lg:pb-40 overflow-hidden">
          <div className="absolute inset-0 z-0">
            <div
              className="w-full h-full opacity-30"
              style={{
                background:
                  "radial-gradient(ellipse at 30% 20%, hsl(260 85% 60% / 0.4), transparent 50%), radial-gradient(ellipse at 70% 60%, hsl(190 90% 55% / 0.3), transparent 55%), linear-gradient(180deg, transparent, hsl(var(--background)))",
              }}
            />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,hsl(var(--primary)/0.15)_1px,transparent_0)] [background-size:32px_32px] opacity-40" />
            <div className="absolute inset-0 bg-gradient-to-b from-background/10 via-background/80 to-background"></div>
          </div>

          <div className="container mx-auto px-6 relative z-10 text-center max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary mb-8 font-mono text-sm"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Платформа аналитики и цен v2.0
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="text-5xl lg:text-7xl font-bold tracking-tight mb-8 leading-tight"
            >
              Быстрый мониторинг и анализ цен <br >
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-cyan-400">
                российского e-commerce
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed"
            >
              PriceHub объединяет покупателей и продавцов. Находите лучшие цены среди миллионов товаров.
              Анализируйте свои продажи на всех маркетплейсах в одном окне.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link href="/register">
                <Button
                  size="lg"
                  className="h-14 px-10 text-lg font-mono w-full sm:w-auto rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
                  data-testid="button-cta-register"
                >
                  Начать работу <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/login">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-14 px-10 text-lg font-mono w-full sm:w-auto rounded-full border-border hover:bg-muted"
                  data-testid="button-cta-login"
                >
                  Войти по Hub ID
                </Button>
              </Link>
            </motion.div>
          </div>
        </section>

        <section className="py-12 border-y border-border/50 bg-card/30">
          <div className="container mx-auto px-6">
            <p className="text-center text-sm font-mono text-muted-foreground mb-8">
              ПОДДЕРЖИВАЕМЫЕ МАРКЕТПЛЕЙСЫ
            </p>
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 0.7 }}
              viewport={{ once: true }}
              className="flex flex-wrap justify-center gap-8 lg:gap-16 items-center"
            >
              <span className="text-2xl font-bold tracking-tighter text-blue-500">OZON</span>
              <span className="text-2xl font-bold tracking-tighter text-purple-500">WILDBERRIES</span>
              <span className="text-2xl font-bold tracking-tighter text-yellow-500">ЯНДЕКС МАРКЕТ</span>
              <span className="text-2xl font-bold tracking-tighter text-orange-500">DNS</span>
              <span className="text-2xl font-bold tracking-tighter text-red-500">ALIEXPRESS</span>
            </motion.div>
          </div>
        </section>

        <section className="py-24 lg:py-32 container mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            {[
              {
                icon: Search,
                title: "Для покупателей",
                text: "Глобальный поиск по всем площадкам. Сравнивайте цены, читайте отзывы и экономьте до 40% на каждой покупке с помощью наших умных алгоритмов.",
              },
              {
                icon: BarChart3,
                title: "Для продавцов",
                text: "Сводная аналитика по всем магазинам. Отслеживайте маржинальность, остатки и конкурентов. Получайте AI-рекомендации по ценообразованию.",
              },
              {
                icon: ShieldCheck,
                title: "Единый Hub ID",
                text: "Один аккаунт для всех сервисов платформы. Безопасная авторизация, встроенные чаты с продавцами и защита данных на уровне Enterprise.",
              },
            ].map((card, i) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                whileHover={{ y: -4 }}
                className="p-8 rounded-3xl bg-card border border-border hover:border-primary/50 transition-colors"
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                  <card.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-4">{card.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{card.text}</p>
              </motion.div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-12 bg-card">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <Logo className="w-6 h-6 rounded-full grayscale opacity-70" />
            <span className="font-mono font-bold text-muted-foreground">PriceHub</span>
          </div>
          <p className="text-sm text-muted-foreground font-mono">
            &copy; {new Date().getFullYear()} PriceHub Platform. Все права защищены.
          </p>
        </div>
      </footer>
    </div>
  );
}
