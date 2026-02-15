import { spawn, type ChildProcess } from "node:child_process";
import { resolve } from "node:path";
import process from "node:process";
import { gbvConfig } from "@gbv/config";

function run(command: string, args: string[], options: { wait: true }): Promise<number>;
function run(command: string, args: string[], options?: { wait?: false }): ChildProcess;
function run(command: string, args: string[], options: { wait?: boolean } = {}) {
  const child = spawn(command, args, {
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  if (options.wait) {
    return new Promise<number>((resolveCode) => {
      child.on("exit", (code) => resolveCode(code ?? 0));
    });
  }

  return child;
}

function terminate(pid?: number): void {
  if (!pid) return;

  if (process.platform === "win32") {
    spawn("taskkill", ["/pid", String(pid), "/t", "/f"], {
      stdio: "ignore",
      shell: true,
    });
    return;
  }

  process.kill(pid, "SIGTERM");
}

async function main() {
  const pnpm = "corepack";
  const pnpmArgs = ["pnpm"];
  console.log("[dev] building extension artifacts...");
  const buildExit = await run(pnpm, [...pnpmArgs, "--filter", "@gbv/extension", "build"], {
    wait: true,
  });
  if (buildExit !== 0) {
    process.exit(buildExit);
  }

  console.log(`[dev] extension unpacked directory: ${resolve(gbvConfig.extension.buildDir)}`);
  console.log(`[dev] synthetic hub URL: ${gbvConfig.origins.syntheticClient}/hub`);
  console.log(
    `[dev] synthetic course catalog API: ${gbvConfig.origins.syntheticClient}${gbvConfig.demo.courseCatalogApiPath}`,
  );

  const server = run(pnpm, [...pnpmArgs, "--filter", "@gbv/server", "dev"]);
  const client = run(pnpm, [...pnpmArgs, "--filter", "@gbv/synthetic-client", "dev"]);

  const shutdown = () => {
    terminate(server.pid);
    terminate(client.pid);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
