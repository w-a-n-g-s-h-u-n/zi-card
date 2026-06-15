export type OcrModelSpec = {
  cacheKey: string;
  configUrl: string;
  modelName: string;
  onnxUrl: string;
};

export type OcrModelAssetUrl = {
  modelName: string;
  url: string;
};

const OCR_MODEL_CACHE_NAME = "character-practice:paddleocr-models";
const OCR_MODEL_CACHE_VERSION = "paddleocr-v6-tiny-20260615";
const MODELSCOPE_BASE_URL = "https://modelscope.cn/models/PaddlePaddle";
const TAR_BLOCK_SIZE = 512;

export const OCR_DETECTION_MODEL: OcrModelSpec = {
  cacheKey: `${OCR_MODEL_CACHE_VERSION}:det`,
  configUrl: `${MODELSCOPE_BASE_URL}/PP-OCRv6_tiny_det_onnx/resolve/master/inference.yml`,
  modelName: "PP-OCRv6_tiny_det",
  onnxUrl: `${MODELSCOPE_BASE_URL}/PP-OCRv6_tiny_det_onnx/resolve/master/inference.onnx`,
};

export const OCR_RECOGNITION_MODEL: OcrModelSpec = {
  cacheKey: `${OCR_MODEL_CACHE_VERSION}:rec`,
  configUrl: `${MODELSCOPE_BASE_URL}/PP-OCRv6_tiny_rec_onnx/resolve/master/inference.yml`,
  modelName: "PP-OCRv6_tiny_rec",
  onnxUrl: `${MODELSCOPE_BASE_URL}/PP-OCRv6_tiny_rec_onnx/resolve/master/inference.onnx`,
};

type TarEntry = {
  data: Uint8Array;
  name: string;
};

const memoryModelCache = new Map<string, Uint8Array>();

export async function createOcrModelAssetUrl(spec: OcrModelSpec): Promise<OcrModelAssetUrl> {
  const tarBytes = await loadModelTar(spec);
  const blob = new Blob([toArrayBuffer(tarBytes)], { type: "application/x-tar" });

  return {
    modelName: spec.modelName,
    url: URL.createObjectURL(blob),
  };
}

async function loadModelTar(spec: OcrModelSpec): Promise<Uint8Array> {
  const cachedTar = await readCachedModelTar(spec.cacheKey);

  if (cachedTar) {
    return cachedTar;
  }

  const [modelBytes, configBytes] = await Promise.all([
    fetchModelBytes(spec.onnxUrl),
    fetchModelBytes(spec.configUrl),
  ]);

  assertModelConfig(spec, configBytes);

  const tarBytes = createTarArchive([
    { data: modelBytes, name: "inference.onnx" },
    { data: configBytes, name: "inference.yml" },
  ]);

  memoryModelCache.set(spec.cacheKey, tarBytes);
  await writeCachedModelTar(spec.cacheKey, tarBytes);

  return tarBytes;
}

async function fetchModelBytes(url: string): Promise<Uint8Array> {
  const response = await fetch(url, {
    cache: "force-cache",
    mode: "cors",
  });

  if (!response.ok) {
    throw new Error(`模型下载失败：HTTP ${response.status}`);
  }

  return new Uint8Array(await response.arrayBuffer());
}

async function readCachedModelTar(cacheKey: string): Promise<Uint8Array | null> {
  const memoryCache = memoryModelCache.get(cacheKey);

  if (memoryCache) {
    return memoryCache;
  }

  if (!("caches" in window)) {
    return null;
  }

  try {
    const cache = await caches.open(OCR_MODEL_CACHE_NAME);
    const response = await cache.match(getCacheRequest(cacheKey));

    if (!response?.ok) {
      return null;
    }

    const tarBytes = new Uint8Array(await response.arrayBuffer());
    memoryModelCache.set(cacheKey, tarBytes);

    return tarBytes;
  } catch {
    return null;
  }
}

async function writeCachedModelTar(cacheKey: string, tarBytes: Uint8Array): Promise<void> {
  if (!("caches" in window)) {
    return;
  }

  try {
    const cache = await caches.open(OCR_MODEL_CACHE_NAME);
    const response = new Response(toArrayBuffer(tarBytes), {
      headers: {
        "Content-Type": "application/x-tar",
      },
    });

    await cache.put(getCacheRequest(cacheKey), response);
  } catch {
    // Cache Storage is an optimization; OCR can still use the in-memory bytes.
  }
}

function getCacheRequest(cacheKey: string): Request {
  const origin = window.location.origin === "null" ? "https://character-practice.local" : window.location.origin;
  const url = new URL(`/__ocr-model-cache/${encodeURIComponent(cacheKey)}`, origin);

  return new Request(url);
}

function assertModelConfig(spec: OcrModelSpec, configBytes: Uint8Array) {
  const configText = new TextDecoder().decode(configBytes);

  if (!configText.includes(`model_name: ${spec.modelName}`)) {
    throw new Error(`模型配置不匹配：${spec.modelName}`);
  }
}

function createTarArchive(entries: TarEntry[]): Uint8Array {
  const totalSize =
    entries.reduce((sum, entry) => sum + TAR_BLOCK_SIZE + entry.data.byteLength + getTarPadding(entry.data), 0) +
    TAR_BLOCK_SIZE * 2;
  const archive = new Uint8Array(totalSize);
  let offset = 0;

  for (const entry of entries) {
    archive.set(createTarHeader(entry.name, entry.data.byteLength), offset);
    offset += TAR_BLOCK_SIZE;
    archive.set(entry.data, offset);
    offset += entry.data.byteLength + getTarPadding(entry.data);
  }

  return archive;
}

function createTarHeader(name: string, size: number): Uint8Array {
  const header = new Uint8Array(TAR_BLOCK_SIZE);

  writeAscii(header, 0, 100, name);
  writeOctal(header, 100, 8, 0o644);
  writeOctal(header, 108, 8, 0);
  writeOctal(header, 116, 8, 0);
  writeOctal(header, 124, 12, size);
  writeOctal(header, 136, 12, 0);

  for (let index = 148; index < 156; index += 1) {
    header[index] = 0x20;
  }

  header[156] = "0".charCodeAt(0);
  writeAscii(header, 257, 6, "ustar");
  writeAscii(header, 263, 2, "00");
  writeChecksum(header, header.reduce((sum, byte) => sum + byte, 0));

  return header;
}

function writeAscii(target: Uint8Array, offset: number, length: number, value: string) {
  if (value.length > length) {
    throw new Error(`tar 字段过长：${value}`);
  }

  for (let index = 0; index < value.length; index += 1) {
    const charCode = value.charCodeAt(index);

    if (charCode > 0x7f) {
      throw new Error(`tar 字段必须是 ASCII：${value}`);
    }

    target[offset + index] = charCode;
  }
}

function writeOctal(target: Uint8Array, offset: number, length: number, value: number) {
  const octal = Math.trunc(value).toString(8);

  if (octal.length > length - 1) {
    throw new Error(`tar 八进制字段过长：${String(value)}`);
  }

  writeAscii(target, offset, length, `${octal.padStart(length - 1, "0")}\0`);
}

function writeChecksum(target: Uint8Array, checksum: number) {
  const octal = checksum.toString(8);

  if (octal.length > 6) {
    throw new Error("tar checksum 过长");
  }

  writeAscii(target, 148, 6, octal.padStart(6, "0"));
  target[154] = 0;
  target[155] = 0x20;
}

function getTarPadding(bytes: Uint8Array): number {
  return (TAR_BLOCK_SIZE - (bytes.byteLength % TAR_BLOCK_SIZE)) % TAR_BLOCK_SIZE;
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);

  return buffer;
}
