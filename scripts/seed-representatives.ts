import { disconnectImporter, seedRepresentativeRecords } from "@/scripts/import-lib";

seedRepresentativeRecords()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectImporter();
  });
