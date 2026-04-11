import { ReportGarbageSheet } from "@/components/civic/report-garbage-sheet";
import { getCivicRepository } from "@/lib/civic/repository";
import { toMapReports, toMapWards, toWardOptions } from "@/lib/civic/map-view";

export const dynamic = "force-dynamic";

export default async function NewReportPage() {
  const repository = getCivicRepository();
  const [wards, reports] = await Promise.all([
    repository.listWards(),
    repository.listReports(),
  ]);

  return (
    <ReportGarbageSheet
      wardOptions={toWardOptions(wards)}
      reports={toMapReports(reports, wards)}
      wards={toMapWards(wards)}
    />
  );
}
