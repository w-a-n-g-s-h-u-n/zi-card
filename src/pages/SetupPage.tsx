import {
  BookOpenText,
  Brush,
  CheckCircle2,
  Dice5,
  Eye,
  ImageUp,
  ListRestart,
  Loader2,
  Pencil,
  Play,
  Share2,
  Type,
  Trash2,
  Volume2,
} from "lucide-react";
import type { ChangeEvent } from "react";
import { useRef } from "react";
import type { LucideIcon } from "lucide-react";
import { MODE_CONFIGS, MODE_ICONS } from "../modes";
import type { CharacterDraft, CharacterPreviewItem } from "../types/character";
import type { PracticeMode } from "../types/mode";
import { Button } from "../ui/Button";
import { SegmentedControl } from "../ui/SegmentedControl";
import { Toggle } from "../ui/Toggle";
import { joinCharacters } from "../utils/text";
import type { CharacterFont, StoredSettings } from "../storage/storageTypes";
import { getRecentListKey } from "../storage/localStorage";
import type { OcrUiState } from "../types/ocr";

const CHARACTER_FONT_OPTIONS: Array<{ value: CharacterFont; label: string; icon: LucideIcon }> = [
  { value: "sans", label: "标准", icon: Type },
  { value: "kai", label: "楷体", icon: BookOpenText },
  { value: "handwriting", label: "手写", icon: Brush },
];

type SetupPageProps = {
  inputText: string;
  ocrState: OcrUiState;
  settings: StoredSettings;
  recentLists: CharacterDraft[][];
  previewItems: CharacterPreviewItem[];
  onInputChange: (value: string) => void;
  onPinyinChange: (char: string, pinyin: string) => void;
  onSettingsChange: (settings: StoredSettings) => void;
  onUseRecent: (drafts: CharacterDraft[]) => void;
  onEditRecent: (drafts: CharacterDraft[]) => void;
  onDeleteRecent: (drafts: CharacterDraft[]) => void;
  onImageFilesSelected: (files: File[]) => void;
  onShareRecent: (drafts: CharacterDraft[]) => void;
  editingRecentKey: string | null;
  shareStatus: string | null;
  onShare: () => void;
  onStart: () => void;
};

export function SetupPage({
  inputText,
  ocrState,
  settings,
  recentLists,
  previewItems,
  onInputChange,
  onPinyinChange,
  onSettingsChange,
  onUseRecent,
  onEditRecent,
  onImageFilesSelected,
  onDeleteRecent,
  onShareRecent,
  editingRecentKey,
  shareStatus,
  onShare,
  onStart,
}: SetupPageProps) {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const canStart = previewItems.length > 0;
  const isOcrWorking = ocrState.status === "working";

  function updateSettings(patch: Partial<StoredSettings>) {
    onSettingsChange({
      ...settings,
      ...patch,
    });
  }

  function handleImageInputChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);

    if (files.length > 0) {
      onImageFilesSelected(files);
    }

    event.target.value = "";
  }

  return (
    <main className="setup-page">
      <section className="setup-hero">
        <div className="brand-mark" aria-hidden="true">
          字
        </div>
        <div>
          <h1>识字小练习</h1>
          <p>{previewItems.length > 0 ? `${previewItems.length} 个字` : "录入本次字表"}</p>
        </div>
      </section>

      <section className="setup-grid">
        <div className="input-panel">
          <label className="field-label" htmlFor="character-input">
            {editingRecentKey ? "编辑历史字表" : "本次字表"}
          </label>
          <textarea
            className="character-input"
            id="character-input"
            inputMode="text"
            placeholder="日 月 山 水 火"
            value={inputText}
            onChange={(event: ChangeEvent<HTMLTextAreaElement>) => onInputChange(event.target.value)}
          />

          <div className="image-ocr-panel" data-status={ocrState.status}>
            <div className="image-ocr-topline">
              <button
                className="image-ocr-button"
                disabled={isOcrWorking}
                type="button"
                onClick={() => imageInputRef.current?.click()}
              >
                {isOcrWorking ? (
                  <Loader2 aria-hidden="true" className="spin-icon" size={20} />
                ) : (
                  <ImageUp aria-hidden="true" size={20} />
                )}
                <span>{isOcrWorking ? "识别中" : "识别图片"}</span>
              </button>
              <input
                ref={imageInputRef}
                className="image-ocr-input"
                type="file"
                accept="image/*"
                multiple
                disabled={isOcrWorking}
                onChange={handleImageInputChange}
              />
              <div className="image-ocr-message" aria-live="polite">
                {ocrState.message || "照片字表"}
              </div>
            </div>

            {isOcrWorking ? (
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
          </div>

          <div className="preview-row" aria-label="字表预览">
            {previewItems.length === 0 ? (
              <span className="empty-preview">等待录入</span>
            ) : (
              previewItems.map((item) => {
                const isPolyphonic = item.pinyinOptions.length > 1;

                return (
                  <div className="character-chip" data-polyphonic={isPolyphonic} key={item.char}>
                    <div className="character-chip-main">
                      <span className="character-chip-pinyin">{item.selectedPinyin}</span>
                      <span className="character-chip-char">{item.char}</span>
                    </div>
                    {isPolyphonic ? (
                      <div className="pinyin-choice-row" aria-label={`${item.char} 的读音`}>
                        {item.pinyinOptions.map((pinyin) => (
                          <button
                            className="pinyin-choice"
                            data-selected={item.selectedPinyin === pinyin}
                            key={pinyin}
                            type="button"
                            onClick={() => onPinyinChange(item.char, pinyin)}
                          >
                            {pinyin}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                );
              })
            )}
          </div>

          <div className="input-actions">
            <Button icon={Play} size="large" disabled={!canStart} onClick={onStart}>
              开始
            </Button>
            <Button icon={Share2} variant="quiet" size="large" disabled={!canStart} onClick={onShare}>
              分享
            </Button>
          </div>
          <div className="share-status" aria-live="polite">
            {shareStatus ?? ""}
          </div>
        </div>

        <aside className="settings-panel">
          <SegmentedControl<PracticeMode>
            label="练习模式"
            value={settings.mode}
            onChange={(mode) => updateSettings({ mode })}
            options={MODE_CONFIGS.map((config) => ({
              value: config.id,
              label: config.shortLabel,
              icon: MODE_ICONS[config.id],
            }))}
          />

          <div className="toggle-group">
            <Toggle
              checked={settings.randomOrder}
              icon={<Dice5 aria-hidden="true" size={21} />}
              label="随机"
              onCheckedChange={(randomOrder) => updateSettings({ randomOrder })}
            />
            <Toggle
              checked={settings.showPinyin}
              icon={<Eye aria-hidden="true" size={21} />}
              label="拼音"
              onCheckedChange={(showPinyin) => updateSettings({ showPinyin })}
            />
            <Toggle
              checked={settings.soundEnabled}
              icon={<Volume2 aria-hidden="true" size={21} />}
              label="音效"
              onCheckedChange={(soundEnabled) => updateSettings({ soundEnabled })}
            />
          </div>

          <SegmentedControl
            label="汉字字形"
            value={settings.characterFont}
            onChange={(characterFont) => updateSettings({ characterFont })}
            options={CHARACTER_FONT_OPTIONS}
          />

          <div className="recent-panel">
            <div className="section-heading">
              <ListRestart aria-hidden="true" size={20} />
              <span>最近字表</span>
            </div>
            {recentLists.length === 0 ? (
              <div className="empty-recent">
                <BookOpenText aria-hidden="true" size={22} />
                <span>暂无记录</span>
              </div>
            ) : (
              <div className="recent-list">
                {recentLists.map((drafts) => {
                  const key = getRecentListKey(drafts);
                  const text = joinCharacters(drafts.map((draft) => draft.char));

                  return (
                    <div className="recent-item" data-editing={editingRecentKey === key} key={key}>
                      <button
                        className="recent-main-action"
                        title="使用"
                        type="button"
                        onClick={() => onUseRecent(drafts)}
                      >
                        <CheckCircle2 aria-hidden="true" size={18} />
                        <span>{text}</span>
                      </button>
                      <div className="recent-row-actions">
                        <button
                          aria-label={`编辑字表 ${text}`}
                          className="recent-icon-action"
                          title="编辑"
                          type="button"
                          onClick={() => onEditRecent(drafts)}
                        >
                          <Pencil aria-hidden="true" size={18} />
                        </button>
                        <button
                          aria-label={`分享字表 ${text}`}
                          className="recent-icon-action"
                          title="分享"
                          type="button"
                          onClick={() => onShareRecent(drafts)}
                        >
                          <Share2 aria-hidden="true" size={18} />
                        </button>
                        <button
                          aria-label={`删除字表 ${text}`}
                          className="recent-icon-action recent-icon-action--danger"
                          title="删除"
                          type="button"
                          onClick={() => onDeleteRecent(drafts)}
                        >
                          <Trash2 aria-hidden="true" size={18} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </aside>
      </section>
    </main>
  );
}
