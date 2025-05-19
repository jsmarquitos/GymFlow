import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Users, CreditCard } from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold text-primary">Panel de Administración</h1>
        <nav className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/members">
              <Users className="mr-2 h-4 w-4" /> Miembros
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/subscriptions">
              <CreditCard className="mr-2 h-4 w-4" /> Planes
            </Link>
          </Button>
        </nav>
      </div>
      <div className="border-t pt-6">
        {children}
      </div>
    </div>
  );
}
