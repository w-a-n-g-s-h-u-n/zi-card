export type OcrUiStatus = "idle" | "loading" | "recognizing" | "pending" | "error";

export type OcrFileSummary = {
  charCount: number;
  error?: string;
  fileName: string;
};

export type OcrUiState = {
  candidateText: string;
  message: string;
  progress: number;
  results: OcrFileSummary[];
  status: OcrUiStatus;
  totalFiles: number;
};
