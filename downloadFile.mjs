#!/usr/bin/env node
import process from "process";
import { promises as fs } from "fs";
import path from "path";

async function main() {
  const manifest = await fetch("http://localhost:3000/z.tar.manifest.json");
  const manifestJson = await manifest.json();
  const filename = process.argv[2];

  // get the range for the file we want
  const fileInfo = manifestJson[filename];
  const { startByte, endByte } = fileInfo;

  // fetch the file
  const response = await fetch("http://localhost:3000/z.tar", {
    headers: {
      Range: `bytes=${startByte}-${endByte}`,
    },
  });

  const buffer = await response.arrayBuffer();

  // output file to stdout
  await fs.writeFile(path.join("./tmp", filename), Buffer.from(buffer));
}

main();
