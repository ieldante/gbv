import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { gbvConfig } from "@gbv/config";

const templatePath = fileURLToPath(
  new URL("../apps/extension/public/manifest.template.json", import.meta.url),
);
const outputPath = fileURLToPath(new URL("../apps/extension/public/manifest.json", import.meta.url));

async function main() {
  const template = await readFile(templatePath, "utf8");
  const compiled = template
    .replace(/"__GBV_EXTENSION_NAME__"/g, JSON.stringify(gbvConfig.extension.name))
    .replace(
      /"__GBV_EXTENSION_VERSION__"/g,
      JSON.stringify(gbvConfig.extension.version),
    )
    .replace(
      /__GBV_PERMISSIONS__/g,
      JSON.stringify(gbvConfig.extension.permissions, null, 2),
    )
    .replace(
      /__GBV_HOST_PERMISSIONS__/g,
      JSON.stringify(gbvConfig.extension.hostPermissions, null, 2),
    );

  await writeFile(outputPath, compiled);
  console.log(`Generated extension manifest at ${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
