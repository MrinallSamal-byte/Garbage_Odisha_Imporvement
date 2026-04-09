import { redirect } from "next/navigation";

import { RepresentativeForm } from "@/components/admin/representative-form";
import { RepresentativeCard } from "@/components/report/representative-card";
import { Card } from "@/components/ui/card";
import { getAdminSession } from "@/lib/auth/admin-session";
import { getRepresentativeRepository } from "@/server/repositories/repository-factory";

export default async function AdminRepresentativesPage() {
  const session = await getAdminSession();

  if (!session) {
    redirect("/admin/login");
  }

  const representatives = await getRepresentativeRepository().listRepresentatives();

  return (
    <main className="container py-12">
      <div className="section-label">Representatives</div>
      <h1 className="mt-4 text-4xl font-black tracking-tight text-ink">Manage MLA and MP records used for point-based routing.</h1>
      <Card className="mt-8">
        <RepresentativeForm />
      </Card>
      <div className="mt-8 grid gap-5 md:grid-cols-2">
        {representatives.map((representative) => (
          <RepresentativeCard
            key={representative.id}
            representative={representative}
            constituencyName={representative.constituencyType}
          />
        ))}
      </div>
    </main>
  );
}
