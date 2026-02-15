#!/usr/bin/env node
import { spawn } from "node:child_process";
import { gbvConfig } from "@gbv/config";

const child = spawn(
  "corepack",
  ["pnpm", "exec", "next", "dev", "-p", String(gbvConfig.ports.syntheticClient)],
  {
    stdio: "inherit",
    shell: process.platform === "win32",
    env: {
      ...process.env,
      PORT: String(gbvConfig.ports.syntheticClient),
    },
  },
);

child.on("exit", (code) => process.exit(code ?? 0));
