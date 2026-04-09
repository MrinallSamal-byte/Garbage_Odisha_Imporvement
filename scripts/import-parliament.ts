import { disconnectImporter, importParliamentFromFile } from "@/scripts/import-lib";

importParliamentFromFile(process.argv[2])
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectImporter();
  });
