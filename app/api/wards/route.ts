import { getCivicRepository } from "@/lib/civic/repository";
import { toWardOptions } from "@/lib/civic/map-view";
import { fail, ok } from "@/lib/utils/http";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const wards = await getCivicRepository().listWards();
    return ok({ items: toWardOptions(wards) });
  } catch (error) {
    return fail(error);
  }
}
