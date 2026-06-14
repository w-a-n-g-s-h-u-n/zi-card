import {
  BookOpenText,
  CheckCircle2,
  Dice5,
  Eye,
  ListRestart,
  Pencil,
  Play,
  Share2,
  Trash2,
  Volume2,
} from "lucide-react";
import type { ChangeEvent } from "react";
import { MODE_CONFIGS, MODE_ICONS } from "../modes";
import type { CharacterDraft, CharacterPreviewItem } from "../types/character";
import type { PracticeMode } from "../types/mode";
import { Button } from "../ui/Button";
import { SegmentedControl } from "../ui/SegmentedControl";
import { Toggle } from "../ui/Toggle";
import { joinCharacters } from "../utils/text";
import type { StoredSettings } from "../storage/storageTypes";
import { getRecentListKey } from "../storage/localStorage";

type SetupPageProps = {
  inputText: string;
  settings: StoredSettings;
  recentLists: CharacterDraft[][];
  previewItems: CharacterPreviewItem[];
  onInputChange: (value: string) => void;
  onPinyinChange: (char: string, pinyin: string) => void;
  onSettingsChange: (settings: StoredSettings) => void;
  onUseRecent: (drafts: CharacterDraft[]) => void;
  onEditRecent: (drafts: CharacterDraft[]) => void;
  onDeleteRecent: (drafts: CharacterDraft[]) => void;
  onShareRecent: (drafts: CharacterDraft[]) => void;
  editingRecentKey: string | null;
  shareStatus: string | null;
  onShare: () => void;
  onStart: () => void;
};

export function SetupPage({
  inputText,
  settings,
  recentLists,
  previewItems,
  onInputChange,
  onPinyinChange,
  onSettingsChange,
  onUseRecent,
  onEditRecent,
  onDeleteRecent,
  onShareRecent,
  editingRecentKey,
  shareStatus,
  onShare,
  onStart,
}: SetupPageProps) {
  const canStart = previewItems.length > 0;

  function updateSettings(patch: Partial<StoredSettings>) {
    onSettingsChange({
      ...settings,
      ...patch,
    });
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
