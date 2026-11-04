// What a file is, in words (R19-03): kind by MIME then extension, the type word, the size, the line.
// node --test (type stripping).
import { test } from "node:test"
import assert from "node:assert/strict"

import { fileExtension, fileFormat, fileKind, fileLine, fileTypeLabel, formatFileSize } from "./file-kind.ts"

test("kind: the MIME type first", () => {
  assert.equal(fileKind({ type: "image/jpeg" }), "image")
  assert.equal(fileKind({ type: "image/heic", name: "IMG_4821.HEIC" }), "image")
  assert.equal(fileKind({ type: "application/pdf" }), "pdf")
  assert.equal(fileKind({ type: "text/plain" }), "text")
  assert.equal(fileKind({ type: "application/json" }), "text")
  assert.equal(fileKind({ type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" }), "document")
  assert.equal(fileKind({ type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), "spreadsheet")
  assert.equal(fileKind({ type: "text/csv" }), "spreadsheet")
  assert.equal(fileKind({ type: "application/zip" }), "archive")
  assert.equal(fileKind({ type: "application/octet-stream" }), "other")
  // The type wins over the name when both are known.
  assert.equal(fileKind({ type: "text/plain", name: "photo.jpg" }), "text")
})

test("kind: the extension when there is no type, else other", () => {
  assert.equal(fileKind({ name: "will.pdf" }), "pdf")
  assert.equal(fileKind({ name: "IMG_4821.jpg" }), "image")
  assert.equal(fileKind({ name: "design-system.zip" }), "archive")
  assert.equal(fileKind({ name: "financial-model.xlsx" }), "spreadsheet")
  assert.equal(fileKind({ name: "letter.docx" }), "document")
  assert.equal(fileKind({ name: "notes.md", type: "" }), "text")
  assert.equal(fileKind({ name: "statement" }), "other")
  assert.equal(fileKind({ name: ".gitignore" }), "other")
  assert.equal(fileKind({}), "other")
})

test("extension: lower-cased, without the dot, only when it looks like one", () => {
  assert.equal(fileExtension("Scan.PDF"), "pdf")
  assert.equal(fileExtension("archive.tar.gz"), "gz")
  assert.equal(fileExtension("statement"), undefined)
  assert.equal(fileExtension("ends.with.dot."), undefined)
  assert.equal(fileExtension("a.not an extension"), undefined)
  assert.equal(fileExtension(undefined), undefined)
})

test("type word: the extension in capitals, jpeg as JPG, from the MIME type when the name has none", () => {
  assert.equal(fileTypeLabel({ name: "sales-dashboard.pdf" }), "PDF")
  assert.equal(fileTypeLabel({ name: "photo.jpeg" }), "JPG")
  assert.equal(fileTypeLabel({ name: "IMG_4821.jpg", type: "image/jpeg" }), "JPG")
  assert.equal(fileTypeLabel({ name: "front", type: "image/png" }), "PNG")
  assert.equal(fileTypeLabel({ type: "application/pdf" }), "PDF")
  assert.equal(fileTypeLabel({ name: "statement", type: "application/octet-stream" }), undefined)
  assert.equal(fileTypeLabel({}), undefined)
})

test("kind: a dozen formats from the intake's table, by name and by MIME type (R20-17)", () => {
  const byName: Array<[string, string]> = [
    ["deck.pptx", "document"],
    ["pages.pages", "document"],
    ["ledger.numbers", "spreadsheet"],
    ["export.parquet", "spreadsheet"],
    ["backup.tgz", "archive"],
    ["app.jar", "archive"],
    ["index.tsx", "text"],
    ["config.yml", "text"],
    ["subtitle.srt", "text"],
    ["logo.ai", "image"],
    ["portrait.heif", "image"],
    ["clip.mp4", "other"],
    ["song.flac", "other"],
    ["setup.exe", "other"],
    ["brand.woff2", "other"],
  ]
  for (const [name, kind] of byName) assert.equal(fileKind({ name }), kind, name)
  const byType: Array<[string, string]> = [
    ["application/vnd.openxmlformats-officedocument.presentationml.presentation", "document"],
    ["application/vnd.rar", "archive"],
    ["application/x-sqlite3", "spreadsheet"],
    ["text/markdown", "text"],
    ["text/x-python", "text"],
    ["message/rfc822", "text"],
    ["image/avif", "image"],
    ["image/vnd.adobe.photoshop", "image"],
    ["video/quicktime", "other"],
    ["audio/mpeg", "other"],
  ]
  for (const [type, kind] of byType) assert.equal(fileKind({ type }), kind, type)
  // A name that is an object's own key is not a format.
  assert.equal(fileKind({ name: "x.valueof" }), "other")
})

test("format: the band word, from the name else the MIME type, jpeg as JPG", () => {
  assert.equal(fileFormat({ name: "will.pdf" }), "PDF")
  assert.equal(fileFormat({ name: "letter.docx" }), "DOCX")
  assert.equal(fileFormat({ name: "photo.jpeg" }), "JPG")
  assert.equal(fileFormat({ name: "IMG_4821.HEIC" }), "HEIC")
  assert.equal(fileFormat({ name: "scans.zip" }), "ZIP")
  assert.equal(fileFormat({ name: "bundle.7z" }), "7Z")
  assert.equal(fileFormat({ type: "image/png" }), "PNG")
  assert.equal(fileFormat({ type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), "XLSX")
  assert.equal(fileFormat({ name: "front", type: "image/jpeg" }), "JPG")
  // The name wins over the type for the word, as fileTypeLabel does.
  assert.equal(fileFormat({ name: "notes.md", type: "text/plain" }), "MD")
})

test("format: a long extension is shortened by the table, or has none", () => {
  assert.equal(fileFormat({ name: "ledger.numbers" }), "NUM")
  assert.equal(fileFormat({ name: "data.parquet" }), "PARQ")
  assert.equal(fileFormat({ name: "schema.graphql" }), "GQL")
  assert.equal(fileFormat({ name: "weights.safetensors" }), "SAFE")
  assert.equal(fileFormat({ name: "notes.pages" }), "PAGES")
  assert.equal(fileFormat({ name: "thing.backup1" }), undefined)
  // No extension, no type, an opaque type: no band.
  assert.equal(fileFormat({ name: "statement" }), undefined)
  assert.equal(fileFormat({ name: "statement", type: "application/octet-stream" }), undefined)
  assert.equal(fileFormat({}), undefined)
})

test("size: binary units, one decimal under 10, none above", () => {
  assert.equal(formatFileSize(0), "0 B")
  assert.equal(formatFileSize(960), "960 B")
  assert.equal(formatFileSize(12 * 1024), "12 KB")
  assert.equal(formatFileSize(820 * 1024), "820 KB")
  assert.equal(formatFileSize(1.1 * 1024 * 1024), "1.1 MB")
  assert.equal(formatFileSize(2.4 * 1024 * 1024), "2.4 MB")
  assert.equal(formatFileSize(10.04 * 1024 * 1024), "10 MB")
  assert.equal(formatFileSize(1023.7 * 1024), "1 MB")
  assert.equal(formatFileSize(3 * 1024 ** 3), "3 GB")
  assert.equal(formatFileSize(-1), "")
  assert.equal(formatFileSize(Number.NaN), "")
})

test("the line: both halves, one, or none", () => {
  assert.equal(fileLine({ name: "sales-dashboard.pdf", size: 2.4 * 1024 * 1024 }), "PDF · 2.4 MB")
  assert.equal(fileLine({ name: "sales-dashboard.pdf" }), "PDF")
  assert.equal(fileLine({ name: "statement", size: 12 * 1024 }), "12 KB")
  assert.equal(fileLine({ type: "image/png", size: 820 * 1024 }), "PNG · 820 KB")
  assert.equal(fileLine({}), "")
})
