#!/usr/bin/env node
const process = require("process");
const fs = require("fs");
const tar = require("tar");

const tarballPath = process.argv[2];

let totalOffset = 0;
let result = {};
let id = 0;

const parser = new tar.Parse();

parser.on("entry", (entry) => {
  const headerSize = 512; // Tar header size is usually 512 bytes
  const BLOCK_SIZE = 512; // for MacOS
  const fileSize = entry.type === "File" ? entry.size : 0;

  const startByte = fileSize > 0 ? totalOffset + headerSize : null;
  const endByte = fileSize > 0 ? startByte + fileSize - 1 : null;
  const padding =
    fileSize % BLOCK_SIZE ? BLOCK_SIZE - (fileSize % BLOCK_SIZE) : 0;

  const fileInfo = {
    id,
    filePath: entry.path,
    fileType: entry.type,
    startByte,
    endByte,
    fileSize,
    headerSize,
    padding,
    entry,
  };

  result[entry.path] = fileInfo;

  totalOffset += fileSize + headerSize + padding;
  id += 1;
  entry.resume(); // Discard the file content and move to the next entry
});

parser.on("end", () => {
  console.log(JSON.stringify(result, null, 2));
});

fs.createReadStream(tarballPath).pipe(parser);
