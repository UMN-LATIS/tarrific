#!/usr/bin/env node
//This script is used to parse a tarball and output a gzipped JSON file with the index

const process = require("process");
const fs = require("fs");
const tar = require("tar");
const { Readable } = require('stream');
const { createGzip } = require('zlib');


const tarballPath = process.argv[2];
const outputPath = process.argv[3];

let totalOffset = 0;
let result = {};
let id = 0;


async function compressAndWriteToFile(data, filename) {
  // Create a readable stream from the string
  const readable = Readable.from(data);
  // Create a writable stream to hold the compressed data
  const writable = fs.createWriteStream(filename);
  // Create a compression transform stream with the gzip algorithm
  const compressionStream = createGzip();
  // Pipe the data through the compression stream and into the writable stream
  await readable.pipe(compressionStream).pipe(writable);
  console.log(`Compressed data written to ${filename}`);
}

const parser = new tar.Parse();

parser.on("entry", (entry) => {
  const headerSize = 512; // Tar header size is usually 512 bytes
  const BLOCK_SIZE = 512; // for MacOS
  const fileSize = entry.type === "File" ? entry.size : 0;

  const s = fileSize > 0 ? totalOffset + headerSize : null;
  const e = fileSize > 0 ? s + fileSize - 1 : null;
  const padding =
    fileSize % BLOCK_SIZE ? BLOCK_SIZE - (fileSize % BLOCK_SIZE) : 0;

  const fileInfo = {
    s,
    e,
  };

  result[entry.path] = fileInfo;

  totalOffset += fileSize + headerSize + padding;
  id += 1;
  entry.resume(); // Discard the file content and move to the next entry
});


parser.on("end", () => {
  let content = JSON.stringify(result, null, 2);
  let compressedContent = compressAndWriteToFile(content, outputPath)
});

fs.createReadStream(tarballPath).pipe(parser);
