import { seedPoliticalAreaMapping } from "@/features/political-representatives/server/seed";
import { disconnectImporter } from "@/scripts/import-lib";

seedPoliticalAreaMapping()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectImporter();
  });
