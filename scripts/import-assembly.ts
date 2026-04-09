import { disconnectImporter, importAssemblyFromFile } from "@/scripts/import-lib";

importAssemblyFromFile(process.argv[2])
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectImporter();
  });
