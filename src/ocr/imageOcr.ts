import Tesseract from "tesseract.js";
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

export type ImageOcrProgress = {
  completedFiles: number;
  fileName?: string;
  fileProgress: number;
  overallProgress: number;
  status: string;
  totalFiles: number;
};

const IMAGE_FILE_RE = /\.(bmp|gif|jpe?g|png|tiff?|webp)$/i;
const CHINESE_LANGUAGE = "chi_sim";

export async function recognizeCharacterImages(
  files: File[],
  onProgress: (progress: ImageOcrProgress) => void,
): Promise<ImageOcrBatchResult> {
  const imageFiles = files.filter(isImageFile);

  if (imageFiles.length === 0) {
    throw new Error("请选择图片文件");
  }

  let completedFiles = 0;
  let currentFileName = imageFiles[0]?.name;
  let currentFileProgress = 0;
  const fileResults: ImageOcrFileResult[] = [];

  function emit(status: string, fileProgress = currentFileProgress) {
    currentFileProgress = fileProgress;
    onProgress({
      completedFiles,
      fileName: currentFileName,
      fileProgress,
      overallProgress: Math.min(1, (completedFiles + fileProgress) / imageFiles.length),
      status,
      totalFiles: imageFiles.length,
    });
  }

  emit("准备识别", 0);

  const worker = await Tesseract.createWorker(CHINESE_LANGUAGE, Tesseract.OEM.LSTM_ONLY, {
    logger(message) {
      if (message.status === "recognizing text") {
        emit("正在识别", message.progress);
        return;
      }

      emit(getReadableWorkerStatus(message.status), 0);
    },
  });

  try {
    await worker.setParameters({
      preserve_interword_spaces: "1",
      tessedit_pageseg_mode: Tesseract.PSM.SPARSE_TEXT,
      user_defined_dpi: "300",
    });

    for (const file of imageFiles) {
      currentFileName = file.name;
      currentFileProgress = 0;
      emit("正在识别", 0);

      try {
        const result = await worker.recognize(file);
        const text = result.data.text;
        const chars = extractUniqueCharacters(text);

        fileResults.push({
          chars,
          fileName: file.name,
          text,
        });
      } catch (error) {
        fileResults.push({
          chars: [],
          error: error instanceof Error ? error.message : "识别失败",
          fileName: file.name,
          text: "",
        });
      } finally {
        completedFiles += 1;
        emit("已完成", 1);
      }
    }
  } finally {
    await worker.terminate().catch(() => undefined);
  }

  return {
    chars: mergeUniqueCharacters(fileResults.flatMap((result) => result.chars)),
    files: fileResults,
    text: fileResults.map((result) => result.text).filter(Boolean).join("\n"),
  };
}

function isImageFile(file: File): boolean {
  return file.type.startsWith("image/") || IMAGE_FILE_RE.test(file.name);
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

function getReadableWorkerStatus(status: string): string {
  if (status.includes("loading")) {
    return "加载识别模型";
  }

  if (status.includes("initializing")) {
    return "初始化识别";
  }

  return status || "准备识别";
}
