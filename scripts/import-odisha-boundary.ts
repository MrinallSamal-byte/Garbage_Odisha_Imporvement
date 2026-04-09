import { disconnectImporter, importOdishaBoundaryFromFile } from "@/scripts/import-lib";

importOdishaBoundaryFromFile(process.argv[2])
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectImporter();
  });
