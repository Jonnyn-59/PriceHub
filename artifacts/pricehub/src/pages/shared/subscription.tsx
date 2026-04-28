import { useListSubscriptionPlans, useGetMySubscription, useSubscribeToPlan, getGetMySubscriptionQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Check, Sparkles } from "lucide-react";
import { toast } from "sonner";

export default function Subscription() {
  const qc = useQueryClient();
  const { data: plans, isLoading: plansLoading } = useListSubscriptionPlans();
  const { data: mySub, isLoading: subLoading } = useGetMySubscription();
  const subscribe = useSubscribeToPlan();

  const handleSubscribe = (planId: string) => {
    subscribe.mutate({ data: { planId } }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getGetMySubscriptionQueryKey() });
        toast.success("Подписка успешно оформлена");
      },
      onError: (err: any) => toast.error(err.message)
    });
  };

  if (plansLoading || subLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      <div className="text-center max-w-2xl mx-auto space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">Выберите свой тариф</h1>
        <p className="text-lg text-muted-foreground">
          Доступ к расширенной аналитике и инструментам автоматизации для профессиональных продавцов и активных покупателей.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 items-start">
        {plans?.map(plan => {
          const isCurrent = mySub?.planId === plan.id;
          const isPopular = plan.id === "pro";
          
          return (
            <Card key={plan.id} className={`relative flex flex-col ${isPopular ? 'border-primary shadow-lg shadow-primary/10 scale-105 z-10' : 'border-border'}`}>
              {isPopular && (
                <div className="absolute -top-4 left-0 right-0 flex justify-center">
                  <Badge className="bg-primary text-primary-foreground font-mono uppercase px-3 py-1">Популярный выбор</Badge>
                </div>
              )}
              {isCurrent && (
                <div className="absolute -top-4 right-4">
                  <Badge variant="outline" className="bg-background font-mono text-emerald-500 border-emerald-500">
                    <Check className="w-3 h-3 mr-1" /> Текущий
                  </Badge>
                </div>
              )}
              <CardHeader className="text-center pb-8 pt-8">
                <CardTitle className="text-2xl mb-2">{plan.name}</CardTitle>
                <CardDescription className="font-mono mb-4">{plan.audience}</CardDescription>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold font-mono">{plan.priceMonthly === 0 ? "Бесплатно" : `${new Intl.NumberFormat('ru-RU').format(plan.priceMonthly)} ₽`}</span>
                  {plan.priceMonthly > 0 && <span className="text-muted-foreground font-mono">/мес</span>}
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <ul className="space-y-4">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start">
                      <Sparkles className="w-5 h-5 mr-3 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm leading-relaxed">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="pt-8">
                <Button 
                  className="w-full font-mono text-base h-12" 
                  variant={isPopular ? "default" : "outline"}
                  disabled={isCurrent || subscribe.isPending}
                  onClick={() => handleSubscribe(plan.id)}
                >
                  {subscribe.isPending && subscribe.variables?.data.planId === plan.id ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : isCurrent ? (
                    "Активный тариф"
                  ) : plan.priceMonthly === 0 ? (
                    "Перейти на базовый"
                  ) : (
                    "Оформить подписку"
                  )}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
