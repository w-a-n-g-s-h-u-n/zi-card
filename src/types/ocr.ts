export type OcrUiStatus = "idle" | "working" | "done" | "error";

export type OcrFileSummary = {
  charCount: number;
  error?: string;
  fileName: string;
};

export type OcrUiState = {
  message: string;
  progress: number;
  results: OcrFileSummary[];
  status: OcrUiStatus;
  totalFiles: number;
};
