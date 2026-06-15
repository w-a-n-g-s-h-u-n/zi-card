import type { OcrResult } from "@paddleocr/paddleocr-js";
import { extractUniqueCharacters } from "../utils/text";

export type ImageOcrFileResult = {
  chars: string[];
  error?: string;
  fileName: string;
  text: string;
};

export type ImageOcrBatchResult = {
  chars: string[];
  files: ImageOcrFileResult[];
  text: string;
};

export type ImageOcrProgressPhase = "loading" | "preparing" | "recognizing";

export type ImageOcrProgress = {
  completedFiles: number;
  fileName?: string;
  fileProgress: number;
  overallProgress: number;
  phase: ImageOcrProgressPhase;
  status: string;
  totalFiles: number;
};

const IMAGE_FILE_RE = /\.(bmp|gif|jpe?g|png|tiff?|webp)$/i;
const MAX_IMAGE_SIDE = 1600;
const PREPARE_PROGRESS_START = 0.08;
const PREPARE_PROGRESS_END = 0.36;
const RECOGNIZE_PROGRESS = 0.72;

type PaddleOcrModule = typeof import("@paddleocr/paddleocr-js");
type PaddleOcrInstance = Awaited<ReturnType<PaddleOcrModule["PaddleOCR"]["create"]>>;

type PreparedImage = {
  blob: Blob;
  file: File;
  order: number;
};

let paddleOcrPromise: Promise<PaddleOcrInstance> | null = null;

type CollectedFileResult = ImageOcrFileResult & {
  order: number;
};

export async function recognizeCharacterImages(
  files: File[],
  onProgress: (progress: ImageOcrProgress) => void,
): Promise<ImageOcrBatchResult> {
  const imageFiles = files.filter(isImageFile);

  if (imageFiles.length === 0) {
    throw new Error("请选择图片文件");
  }

  onProgress({
    completedFiles: 0,
    fileName: imageFiles[0]?.name,
    fileProgress: 0,
    overallProgress: 0,
    phase: "loading",
    status: "加载本地识别模型",
    totalFiles: imageFiles.length,
  });

  const ocr = await getPaddleOcr();
  const fileResults: CollectedFileResult[] = [];
  const preparedImages: PreparedImage[] = [];

  for (const [index, file] of imageFiles.entries()) {
    const prepareProgress =
      PREPARE_PROGRESS_START +
      ((index + 0.5) / imageFiles.length) * (PREPARE_PROGRESS_END - PREPARE_PROGRESS_START);

    onProgress({
      completedFiles: index,
      fileName: file.name,
      fileProgress: 0.5,
      overallProgress: prepareProgress,
      phase: "preparing",
      status: "处理图片",
      totalFiles: imageFiles.length,
    });

    try {
      preparedImages.push({
        blob: await preprocessImage(file),
        file,
        order: index,
      });
    } catch (error) {
      fileResults.push({
        chars: [],
        error: error instanceof Error ? error.message : "图片处理失败",
        fileName: file.name,
        order: index,
        text: "",
      });
    }
  }

  if (preparedImages.length === 0) {
    return {
      chars: [],
      files: fileResults,
      text: "",
    };
  }

  onProgress({
    completedFiles: 0,
    fileName: preparedImages[0]?.file.name,
    fileProgress: 0,
    overallProgress: RECOGNIZE_PROGRESS,
    phase: "recognizing",
    status: "识别中",
    totalFiles: imageFiles.length,
  });

  const ocrResults = await ocr.predict(
    preparedImages.map((image) => image.blob),
    {
      textDetLimitSideLen: 1280,
      textDetLimitType: "max",
      textRecScoreThresh: 0.2,
    },
  );

  for (const [index, result] of ocrResults.entries()) {
    const file = preparedImages[index]?.file;
    const text = getResultText(result);
    const chars = extractUniqueCharacters(text);

    fileResults.push({
      chars,
      fileName: file?.name ?? `图片 ${index + 1}`,
      order: preparedImages[index]?.order ?? index,
      text,
    });

    onProgress({
      completedFiles: Math.min(index + 1, imageFiles.length),
      fileName: file?.name,
      fileProgress: 1,
      overallProgress: Math.min(1, RECOGNIZE_PROGRESS + ((index + 1) / preparedImages.length) * 0.28),
      phase: "recognizing",
      status: "识别中",
      totalFiles: imageFiles.length,
    });
  }

  const orderedFileResults = orderFileResults(fileResults);

  return {
    chars: mergeUniqueCharacters(orderedFileResults.flatMap((result) => result.chars)),
    files: orderedFileResults,
    text: orderedFileResults.map((result) => result.text).filter(Boolean).join("\n"),
  };
}

export function warmupCharacterOcr(): Promise<void> {
  return getPaddleOcr().then(() => undefined);
}

function getPaddleOcr(): Promise<PaddleOcrInstance> {
  if (!paddleOcrPromise) {
    const promise = import("@paddleocr/paddleocr-js")
      .then(({ PaddleOCR }) =>
        PaddleOCR.create({
          lang: "ch",
          ocrVersion: "PP-OCRv5",
          ortOptions: {
            backend: "wasm",
            numThreads: 1,
          },
        }),
      )
      .catch((error: unknown) => {
        paddleOcrPromise = null;
        throw new Error(`本地 OCR 初始化失败：${getErrorMessage(error)}`);
      });

    paddleOcrPromise = promise;
  }

  return paddleOcrPromise;
}

async function preprocessImage(file: File): Promise<Blob> {
  const image = await loadImage(file);
  const sourceWidth = Math.max(1, image.width);
  const sourceHeight = Math.max(1, image.height);
  const scale = Math.min(1, MAX_IMAGE_SIDE / Math.max(sourceWidth, sourceHeight));
  const width = Math.max(1, Math.round(sourceWidth * scale));
  const height = Math.max(1, Math.round(sourceHeight * scale));
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", { willReadFrequently: true });

  if (!context) {
    closeImage(image);
    throw new Error("当前浏览器不支持图片处理");
  }

  canvas.width = width;
  canvas.height = height;
  context.fillStyle = "#fff";
  context.fillRect(0, 0, width, height);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(image, 0, 0, width, height);
  closeImage(image);
  enhanceCanvas(context, width, height);

  return canvasToBlob(canvas);
}

async function loadImage(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if ("createImageBitmap" in window) {
    try {
      return await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch {
      try {
        return await createImageBitmap(file);
      } catch {
        return loadImageElement(file);
      }
    }
  }

  return loadImageElement(file);
}

function loadImageElement(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const url = URL.createObjectURL(file);

    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("图片读取失败"));
    };
    image.src = url;
  });
}

function closeImage(image: ImageBitmap | HTMLImageElement) {
  if ("close" in image) {
    image.close();
  }
}

function enhanceCanvas(context: CanvasRenderingContext2D, width: number, height: number) {
  const imageData = context.getImageData(0, 0, width, height);
  const { data } = imageData;
  const contrast = 1.28;
  const brightness = 4;

  for (let index = 0; index < data.length; index += 4) {
    const alpha = data[index + 3] / 255;
    const red = blendWithWhite(data[index], alpha);
    const green = blendWithWhite(data[index + 1], alpha);
    const blue = blendWithWhite(data[index + 2], alpha);
    const gray = red * 0.299 + green * 0.587 + blue * 0.114;
    const adjusted = clamp((gray - 128) * contrast + 128 + brightness);

    data[index] = adjusted;
    data[index + 1] = adjusted;
    data[index + 2] = adjusted;
    data[index + 3] = 255;
  }

  context.putImageData(imageData, 0, 0);
}

function blendWithWhite(value: number, alpha: number): number {
  return value * alpha + 255 * (1 - alpha);
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("图片处理失败"));
          return;
        }

        resolve(blob);
      },
      "image/jpeg",
      0.92,
    );
  });
}

function getResultText(result: OcrResult): string {
  return result.items.map((item) => item.text).join("");
}

function isImageFile(file: File): boolean {
  return file.type.startsWith("image/") || IMAGE_FILE_RE.test(file.name);
}

function orderFileResults(results: CollectedFileResult[]): ImageOcrFileResult[] {
  return [...results]
    .sort((left, right) => left.order - right.order)
    .map(({ order: _order, ...result }) => result);
}

function mergeUniqueCharacters(chars: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const char of chars) {
    if (seen.has(char)) {
      continue;
    }

    seen.add(char);
    result.push(char);
  }

  return result;
}

function clamp(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "请手动输入字表";
}
