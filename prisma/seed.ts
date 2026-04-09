import {
  disconnectImporter,
  importAssemblyFromFile,
  importDistrictsFromFile,
  importOdishaBoundaryFromFile,
  importParliamentFromFile,
  seedMockRuntime,
  seedRepresentativeRecords,
} from "@/scripts/import-lib";
import { env } from "@/lib/env";

async function main() {
  if (env.APP_MODE === "mock") {
    await seedMockRuntime();
    return;
  }

  await importOdishaBoundaryFromFile();
  await importDistrictsFromFile();
  await importAssemblyFromFile();
  await importParliamentFromFile();
  await seedRepresentativeRecords();
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectImporter();
  });
