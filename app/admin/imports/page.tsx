import { redirect } from "next/navigation";

import { Card } from "@/components/ui/card";
import { getAdminSession } from "@/lib/auth/admin-session";

const commands = [
  "npm run import:odisha-boundary -- data/imports/odisha-boundary.geojson",
  "npm run import:assembly -- data/imports/assembly.geojson",
  "npm run import:parliament -- data/imports/parliament.geojson",
  "npm run seed:representatives -- data/imports/representatives.json",
];

export default async function AdminImportsPage() {
  const session = await getAdminSession();

  if (!session) {
    redirect("/admin/login");
  }

  return (
    <main className="container py-12">
      <div className="section-label">GIS imports</div>
      <h1 className="mt-4 text-4xl font-black tracking-tight text-ink">Load Odisha boundary, constituency, and representative datasets.</h1>
      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        <Card>
          <h2 className="text-xl font-bold text-ink">Expected files</h2>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-slateblue-700">
            <li>• `odisha-boundary.geojson` with a state MultiPolygon.</li>
            <li>• `assembly.geojson` with `id`, `code`, `name`, and optional `district_name`.</li>
            <li>• `parliament.geojson` with `id`, `code`, and `name`.</li>
            <li>• `representatives.json` or CSV mapped to the representative seed schema.</li>
          </ul>
        </Card>
        <Card>
          <h2 className="text-xl font-bold text-ink">CLI commands</h2>
          <div className="mt-4 space-y-3">
            {commands.map((command) => (
              <div
                key={command}
                className="rounded-[1.25rem] border border-slateblue-100 bg-slateblue-50/70 px-4 py-3 font-mono text-xs text-slateblue-700"
              >
                {command}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </main>
  );
}
