"use client";

import type { SubscriptionPlan } from "@/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Edit, Trash2, CreditCard } from "lucide-react";

interface SubscriptionPlanCardProps {
  plan: SubscriptionPlan;
  onEdit: () => void;
  onDelete: () => void;
}

export function SubscriptionPlanCard({ plan, onEdit, onDelete }: SubscriptionPlanCardProps) {
  return (
    <Card className="flex flex-col h-full shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center text-xl">
          <CreditCard className="mr-2 h-5 w-5 text-primary" />
          {plan.name}
        </CardTitle>
        <CardDescription>
          {plan.duration} - ${plan.price.toFixed(2)}
          {plan.duration !== "Otro" && <span className="text-xs text-muted-foreground"> / {plan.duration.toLowerCase().replace('mensual', 'mes').replace('trimestral', 'trimestre').replace('anual', 'año')}</span>}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow space-y-3">
        {plan.description && <p className="text-sm text-muted-foreground">{plan.description}</p>}
        <ul className="space-y-1.5">
          {plan.features.map((feature, index) => (
            <li key={index} className="flex items-center text-sm">
              <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
              {feature}
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter className="flex justify-end gap-2 border-t pt-4 mt-auto">
        <Button variant="outline" size="sm" onClick={onEdit}>
          <Edit className="mr-1 h-4 w-4" /> Editar
        </Button>
        <Button variant="destructive" size="sm" onClick={onDelete}>
          <Trash2 className="mr-1 h-4 w-4" /> Eliminar
        </Button>
      </CardFooter>
    </Card>
  );
}
