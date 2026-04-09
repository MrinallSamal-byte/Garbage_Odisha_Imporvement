import { disconnectImporter, seedMockRuntime } from "@/scripts/import-lib";

seedMockRuntime()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectImporter();
  });
