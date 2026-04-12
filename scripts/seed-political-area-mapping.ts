import { disconnectImporter, seedPoliticalAreaMapping } from "@/scripts/import-lib";

seedPoliticalAreaMapping()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectImporter();
  });
