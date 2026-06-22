import { CheckCircle2, ImageUp, Loader2, RotateCcw, Trash2 } from "lucide-react";
import type { ChangeEvent } from "react";
import { useRef } from "react";
import type { OcrPreviewImage, OcrUiState } from "../../types/ocr";
import { extractUniqueCharacters } from "../../utils/text";

type ImageOcrPanelProps = {
  isOcrAvailable: boolean;
  ocrPreviewImages: OcrPreviewImage[];
  ocrState: OcrUiState;
  onClearOcr: () => void;
  onConfirmOcr: () => void;
  onImageFilesSelected: (files: File[]) => void;
  onOcrCandidateChange: (value: string) => void;
  onPrepareOcr: () => void;
  onRetryOcr: () => void;
};

export function ImageOcrPanel({
  isOcrAvailable,
  ocrPreviewImages,
  ocrState,
  onClearOcr,
  onConfirmOcr,
  onImageFilesSelected,
  onOcrCandidateChange,
  onPrepareOcr,
  onRetryOcr,
}: ImageOcrPanelProps) {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const isWorking = ocrState.status === "loading" || ocrState.status === "recognizing";
  const showDetails = ocrState.status !== "idle" || ocrPreviewImages.length > 0;
  const hasResult = ocrState.status === "pending";
  const candidateCount = extractUniqueCharacters(ocrState.candidateText).length;
  const canConfirm = candidateCount > 0;
  const imageOcrLabel = ocrState.status === "loading" ? "加载模型" : isWorking ? "识别中" : "识别图片";

  function handleImageInputChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);

    if (files.length > 0) {
      onImageFilesSelected(files);
    }

    event.target.value = "";
  }

  return (
    <div className="image-ocr-panel" data-expanded={showDetails} data-status={ocrState.status}>
      {isOcrAvailable ? (
        <div className="image-ocr-topline">
          <button
            aria-label={imageOcrLabel}
            className="image-ocr-button"
            disabled={isWorking}
            title={imageOcrLabel}
            type="button"
            onClick={() => imageInputRef.current?.click()}
            onFocus={onPrepareOcr}
            onMouseEnter={onPrepareOcr}
            onPointerDown={onPrepareOcr}
            onPointerEnter={onPrepareOcr}
            onTouchStart={onPrepareOcr}
          >
            {isWorking ? <Loader2 aria-hidden="true" className="spin-icon" size={20} /> : <ImageUp aria-hidden="true" size={20} />}
          </button>
          <input
            ref={imageInputRef}
            className="image-ocr-input"
            type="file"
            accept="image/*"
            multiple
            disabled={isWorking}
            onChange={handleImageInputChange}
          />
        </div>
      ) : null}

      {showDetails ? (
        <div className="image-ocr-details">
          <div className="image-ocr-message" aria-live="polite">
            {ocrState.message}
          </div>

          {ocrPreviewImages.length > 0 ? (
            <div className="image-ocr-preview-list" aria-label="待识别图片">
              {ocrPreviewImages.map((image) => (
                <figure className="image-ocr-preview" key={image.id}>
                  <img alt={image.name} src={image.url} />
                  <figcaption>{image.name}</figcaption>
                </figure>
              ))}
            </div>
          ) : null}

          {isWorking ? (
            <div className="image-ocr-progress" aria-label="识别进度">
              <div style={{ width: `${Math.round(ocrState.progress * 100)}%` }} />
            </div>
          ) : null}

          {ocrState.results.length > 0 ? (
            <div className="image-ocr-results" aria-label="图片识别结果">
              {ocrState.results.map((result, index) => (
                <div className="image-ocr-result" data-error={Boolean(result.error)} key={`${result.fileName}-${index}`}>
                  <span>{result.fileName}</span>
                  <strong>{result.error ? "失败" : `${result.charCount} 字`}</strong>
                </div>
              ))}
            </div>
          ) : null}

          {hasResult ? (
            <div className="image-ocr-candidate">
              <div className="image-ocr-candidate-heading">
                <span>候选字表</span>
                <strong>{candidateCount > 0 ? `${candidateCount} 字` : "空"}</strong>
              </div>
              <textarea
                aria-label="图片识别候选字表"
                className="image-ocr-candidate-input"
                inputMode="text"
                placeholder="可编辑后确认加入"
                value={ocrState.candidateText}
                onChange={(event: ChangeEvent<HTMLTextAreaElement>) => onOcrCandidateChange(event.target.value)}
              />
              <div className="image-ocr-actions">
                <button
                  className="image-ocr-action image-ocr-action--confirm"
                  disabled={!canConfirm}
                  type="button"
                  onClick={onConfirmOcr}
                >
                  <CheckCircle2 aria-hidden="true" size={18} />
                  <span>确认加入</span>
                </button>
                <button className="image-ocr-action" disabled={isWorking} type="button" onClick={onRetryOcr}>
                  <RotateCcw aria-hidden="true" size={18} />
                  <span>重新识别</span>
                </button>
                <button className="image-ocr-action image-ocr-action--clear" type="button" onClick={onClearOcr}>
                  <Trash2 aria-hidden="true" size={18} />
                  <span>清空结果</span>
                </button>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
