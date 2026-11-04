/* What a file is, in words a row can show (R19-03, R20-17): its kind (which glyph), its type word
   ("PDF", "JPG"), the short word on FileIcon's label band (`fileFormat`) and its size
   ("1.1 MB"), and the one line that joins them ("PDF · 2.4 MB"). Pure functions, no DOM: a
   `File`, a Blob or a record from the API can all be read the same way through
   `{ name, type, size }`. The kinds are the legacy preview's four (image · pdf · text · other,
   `VaultDocumentPreview.vue`) plus the three the Documents view will meet.
   The MIME type wins over the extension when both are known: a `.jpg` served as `text/plain`
   is text. Sizes are binary (1024) with KB · MB · GB, one decimal under 10 of a unit, none
   above — "820 KB", "1.1 MB", "12 KB", "960 B".
   @from reui.io/r/file-type.json · 2026-10-31 · MIT
   changed: the extension and MIME tables only (its `FILE_TYPE_EXTENSIONS` and `MIME_TYPES`); the
   source's category and colour per format are not kept — each extension maps to one of our seven
   kinds instead, and the colour is the kind's (`--file-*`, theme.css).
   changed: its file-name table (Dockerfile, .env.local, go.mod, LICENSE…) and name patterns are
   not brought: a name with no extension is `other` here (`.gitignore` stays `other`, pinned by
   file-kind.test.ts), and a path or URL is not resolved (a row passes a name).
   changed: the source's `label` overrides for a key too long for the band (NUM, PARQ, GQL, DOCK,
   MAKE, SAFE) are `BAND_WORD`; any other format longer than five characters has no band word. */

export const FILE_KINDS = ["image", "pdf", "document", "spreadsheet", "archive", "text", "other"] as const
export type FileKind = (typeof FILE_KINDS)[number]

/** The parts of a file a row reads. All optional: a name alone still gives a kind and a type word. */
export type FileLike = {
  name?: string | null
  /** The MIME type (`File.type`, `Blob.type`, the API's content type). */
  type?: string | null
  /** Bytes. */
  size?: number | null
}

/* Every extension the table knows, by the kind it draws as. Slides are documents; code, markup,
   config and data files are text; the media, design, application, font and model-weight formats
   have no kind of their own here and are `other` (the label band still names them). Archives are
   what holds files (a jar and a wheel are zips). A spreadsheet is anything of rows and columns,
   a database file included. */
const EXTENSIONS_BY_KIND: Record<FileKind, string> = {
  image: "jpg jpeg png gif webp avif heic heif bmp tif tiff ico raw svg jxl psd ai eps",
  pdf: "pdf",
  document: "doc docx odt rtf pages ppt pptx odp key",
  spreadsheet: "xls xlsx xlsm ods csv tsv numbers parquet sqlite sqlite3 db",
  archive: "zip rar 7z tar gz tgz bz2 xz zst jar whl",
  text:
    "txt md mdx mdc log eml srt vtt " +
    "js jsx mjs cjs ts tsx mts html htm css scss json jsonc xml yaml yml sql py java php rb go rs c cc cpp h hpp cs sh bash zsh ps1 bat rss vue svelte astro graphql gql prisma map kt kts swift dart lua r scala ex exs cu gradle ipynb " +
    "env toml ini conf lock git ignore dockerfile makefile mak mk tf tfvars hcl proto jsonl ndjson diff patch pem crt cer",
  other:
    "mp4 mov avi mkv webm mpeg mpg wmv m3u8 mp3 wav aac flac ogg m4a aiff opus " +
    "fig sketch indd aep xd exe msi dmg apk deb iso app pkg ipa aab rpm ttf otf woff woff2 " +
    "safetensors gguf onnx pt wasm",
}

/* No prototype, so a name ending ".constructor" is not a format. */
const KIND_BY_EXTENSION: Record<string, FileKind | undefined> = Object.assign(
  Object.create(null) as Record<string, FileKind>,
  Object.fromEntries(FILE_KINDS.flatMap((kind) => EXTENSIONS_BY_KIND[kind].split(" ").map((ext) => [ext, kind] as const))),
)

/* The extension a MIME type stands for, where the subtype is not itself the extension. Anything
   else in image/, video/, audio/, font/ or text/ whose subtype is a known extension is read as
   that (`image/avif`), in `mimeExtension`. */
const EXTENSION_BY_MIME: Record<string, string> = {
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/vnd.oasis.opendocument.text": "odt",
  "application/rtf": "rtf",
  "application/vnd.ms-excel": "xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "application/vnd.oasis.opendocument.spreadsheet": "ods",
  "application/vnd.ms-powerpoint": "ppt",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
  "application/vnd.oasis.opendocument.presentation": "odp",
  "application/vnd.ms-excel.sheet.macroenabled.12": "xlsm",
  "application/vnd.apple.keynote": "key",
  "application/zip": "zip",
  "application/x-zip-compressed": "zip",
  "application/vnd.rar": "rar",
  "application/x-rar-compressed": "rar",
  "application/x-7z-compressed": "7z",
  "application/x-tar": "tar",
  "application/gzip": "gz",
  "application/x-gzip": "gz",
  "application/x-bzip2": "bz2",
  "application/zstd": "zst",
  "application/x-xz": "xz",
  "application/java-archive": "jar",
  "application/json": "json",
  "application/xml": "xml",
  "application/yaml": "yaml",
  "application/x-yaml": "yaml",
  "application/rss+xml": "rss",
  "application/javascript": "js",
  "application/node": "cjs",
  "application/x-httpd-php": "php",
  "application/x-sh": "sh",
  "application/x-ipynb+json": "ipynb",
  "application/x-ndjson": "ndjson",
  "application/vnd.sqlite3": "sqlite",
  "application/x-sqlite3": "sqlite",
  "application/vnd.apple.mpegurl": "m3u8",
  "application/x-mpegurl": "m3u8",
  "application/x-subrip": "srt",
  "message/rfc822": "eml",
  "application/x-rpm": "rpm",
  "application/x-pem-file": "pem",
  "application/x-x509-ca-cert": "crt",
  "application/pkix-cert": "crt",
  "application/x-msdownload": "exe",
  "application/x-msi": "msi",
  "application/vnd.android.package-archive": "apk",
  "application/vnd.debian.binary-package": "deb",
  "application/x-apple-diskimage": "dmg",
  "application/x-iso9660-image": "iso",
  "application/x-font-ttf": "ttf",
  "application/font-woff": "woff",
  "application/postscript": "eps",
  "application/vnd.adobe.photoshop": "psd",
  "application/wasm": "wasm",
  "image/vnd.adobe.photoshop": "psd",
  "image/jpeg": "jpg",
  "image/svg+xml": "svg",
  "image/x-icon": "ico",
  "image/vnd.microsoft.icon": "ico",
  "image/tiff": "tif",
  "video/quicktime": "mov",
  "video/x-msvideo": "avi",
  "video/x-matroska": "mkv",
  "video/x-ms-wmv": "wmv",
  "audio/mpeg": "mp3",
  "audio/wav": "wav",
  "audio/x-wav": "wav",
  "audio/mp4": "m4a",
  "audio/x-m4a": "m4a",
  "audio/x-flac": "flac",
  "audio/x-aiff": "aiff",
  "text/plain": "txt",
  "text/markdown": "md",
  "text/x-markdown": "md",
  "text/x-python": "py",
  "text/x-c": "c",
  "text/x-c++src": "cpp",
  "text/x-c++hdr": "hpp",
  "text/x-kotlin": "kt",
  "text/x-swift": "swift",
  "text/x-rsrc": "r",
  "text/x-lua": "lua",
  "text/x-scala": "scala",
  "text/x-diff": "diff",
  "text/x-patch": "patch",
  "text/x-makefile": "makefile",
  "text/yaml": "yaml",
  "text/csv": "csv",
  "text/tab-separated-values": "tsv",
  "text/html": "html",
  "text/css": "css",
  "text/javascript": "js",
  "text/xml": "xml",
}

/* The word on the label band where the extension is too long for it or reads better short (the
   source's `label`s). */
const BAND_WORD: Record<string, string> = {
  numbers: "NUM",
  parquet: "PARQ",
  graphql: "GQL",
  dockerfile: "DOCK",
  makefile: "MAKE",
  safetensors: "SAFE",
}

/** The longest word the band holds at a legible size. */
const BAND_MAX = 5

/** The name's extension, lower-cased, without the dot; undefined when there is none. */
export function fileExtension(name: string | null | undefined): string | undefined {
  const trimmed = (name ?? "").trim()
  const dot = trimmed.lastIndexOf(".")
  if (dot <= 0 || dot === trimmed.length - 1) return undefined
  const ext = trimmed.slice(dot + 1).toLowerCase()
  // Up to eleven: the table's longest is "safetensors".
  return /^[a-z0-9]{1,11}$/.test(ext) ? ext : undefined
}

/* The extension a MIME type stands for: the table, else a media or text subtype that is one
   (`image/avif`, `audio/flac`), else undefined. */
function mimeExtension(type: string): string | undefined {
  const exact = EXTENSION_BY_MIME[type]
  if (exact) return exact
  const [family, subtype] = type.split("/")
  if (!subtype || !/^(?:image|video|audio|font|text)$/.test(family)) return undefined
  const ext = subtype.replace(/^x-/, "")
  return KIND_BY_EXTENSION[ext] ? ext : undefined
}

/** The kind of file: by MIME type first, then by the name's extension, else `other`. */
export function fileKind(file: FileLike): FileKind {
  const type = (file.type ?? "").trim().toLowerCase()
  if (type) {
    const ext = mimeExtension(type)
    if (ext) return KIND_BY_EXTENSION[ext] ?? "other"
    if (type.startsWith("image/")) return "image"
    if (type.startsWith("text/")) return "text"
  }
  const ext = fileExtension(file.name)
  return (ext && KIND_BY_EXTENSION[ext]) || "other"
}

/* The file's extension for a word: the name's, else the MIME type's; jpeg is jpg. */
function wordExtension(file: FileLike): string | undefined {
  const type = (file.type ?? "").trim().toLowerCase()
  const ext = fileExtension(file.name) ?? (type ? mimeExtension(type) : undefined)
  return ext === "jpeg" ? "jpg" : ext
}

/** The type word a row shows: the extension in capitals ("PDF", "JPG"; jpeg → JPG), from the name,
    else from the MIME type; undefined when neither says. */
export function fileTypeLabel(file: FileLike): string | undefined {
  return wordExtension(file)?.toUpperCase()
}

/** The short uppercase word for FileIcon's label band ("PDF", "DOCX", "JPG"), from the same extension
    as `fileTypeLabel`; a long one is shortened by the table ("numbers" → "NUM"), and a format longer
    than five characters with no short form, or no format at all, has none (undefined). */
export function fileFormat(file: FileLike): string | undefined {
  const ext = wordExtension(file)
  if (!ext) return undefined
  const word = BAND_WORD[ext] ?? ext.toUpperCase()
  return word.length <= BAND_MAX ? word : undefined
}

const UNITS = ["B", "KB", "MB", "GB", "TB"] as const

/** A size in words: binary units, one decimal under 10 of a unit ("1.1 MB"), none above ("820 KB"). */
export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return ""
  let n = bytes
  let i = 0
  while (n >= 1024 && i < UNITS.length - 1) {
    n /= 1024
    i++
  }
  if (i === 0) return `${Math.round(n)} B`
  const shown = n < 10 ? Math.round(n * 10) / 10 : Math.round(n)
  // Rounding up to the next unit ("1024 KB") rolls over.
  if (shown >= 1024 && i < UNITS.length - 1) return `1 ${UNITS[i + 1]}`
  return `${shown} ${UNITS[i]}`
}

/** The metadata line under a file's name: "PDF · 2.4 MB", or whichever half is known, or "". */
export function fileLine(file: FileLike): string {
  const parts = [fileTypeLabel(file), file.size != null ? formatFileSize(file.size) : undefined].filter(Boolean)
  return parts.join(" · ")
}
