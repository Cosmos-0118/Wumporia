import { gzipSync } from 'node:zlib'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const distAssetsDir = join(process.cwd(), 'dist', 'assets')
const assetFiles = readdirSync(distAssetsDir)

const jsFiles = assetFiles.filter((file) => file.endsWith('.js'))
const cssFiles = assetFiles.filter((file) => file.endsWith('.css'))

const MAX_JS_RAW_BYTES = 300 * 1024
const MAX_JS_GZIP_BYTES = 170 * 1024
const MAX_CSS_RAW_BYTES = 60 * 1024
const MAX_CSS_GZIP_BYTES = 12 * 1024

function largestMetrics(files) {
  return files.reduce(
    (largest, file) => {
      const fullPath = join(distAssetsDir, file)
      const rawBuffer = readFileSync(fullPath)
      const rawBytes = statSync(fullPath).size
      const gzipBytes = gzipSync(rawBuffer).byteLength

      if (rawBytes > largest.rawBytes) {
        largest.rawBytes = rawBytes
        largest.rawFile = file
      }

      if (gzipBytes > largest.gzipBytes) {
        largest.gzipBytes = gzipBytes
        largest.gzipFile = file
      }

      return largest
    },
    { rawBytes: 0, rawFile: '', gzipBytes: 0, gzipFile: '' },
  )
}

const largestJs = largestMetrics(jsFiles)
const largestCss = largestMetrics(cssFiles)

const failures = []

if (largestJs.rawBytes > MAX_JS_RAW_BYTES) {
  failures.push(
    `Largest JS asset ${largestJs.rawFile} is ${largestJs.rawBytes} bytes (budget ${MAX_JS_RAW_BYTES})`,
  )
}
if (largestJs.gzipBytes > MAX_JS_GZIP_BYTES) {
  failures.push(
    `Largest JS gzip asset ${largestJs.gzipFile} is ${largestJs.gzipBytes} bytes (budget ${MAX_JS_GZIP_BYTES})`,
  )
}
if (largestCss.rawBytes > MAX_CSS_RAW_BYTES) {
  failures.push(
    `Largest CSS asset ${largestCss.rawFile} is ${largestCss.rawBytes} bytes (budget ${MAX_CSS_RAW_BYTES})`,
  )
}
if (largestCss.gzipBytes > MAX_CSS_GZIP_BYTES) {
  failures.push(
    `Largest CSS gzip asset ${largestCss.gzipFile} is ${largestCss.gzipBytes} bytes (budget ${MAX_CSS_GZIP_BYTES})`,
  )
}

if (failures.length > 0) {
  console.error('Bundle budget check failed:')
  for (const failure of failures) {
    console.error(`- ${failure}`)
  }
  process.exit(1)
}

console.log('Bundle budget check passed.')
console.log(
  `Largest JS: ${largestJs.rawFile} (${largestJs.rawBytes} raw, ${largestJs.gzipBytes} gzip)`,
)
console.log(
  `Largest CSS: ${largestCss.rawFile} (${largestCss.rawBytes} raw, ${largestCss.gzipBytes} gzip)`,
)
