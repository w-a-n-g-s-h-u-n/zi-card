import {
  BookOpenText,
  ChevronUp,
  CheckCircle2,
  Copy,
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
import { getCharacterPreview } from "../core/characters";
import { MODE_CONFIGS, MODE_ICONS } from "../modes";
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
  recentLists: string[][];
  onInputChange: (value: string) => void;
  onSettingsChange: (settings: StoredSettings) => void;
  onUseRecent: (chars: string[]) => void;
  onEditRecent: (chars: string[]) => void;
  onDeleteRecent: (chars: string[]) => void;
  onShareRecent: (chars: string[]) => void;
  editingRecentKey: string | null;
  shareHelp: string | null;
  shareStatus: string | null;
  shareUrl: string | null;
  onCloseSharePanel: () => void;
  onCopyShareLink: () => void;
  onShare: () => void;
  onStart: () => void;
};

export function SetupPage({
  inputText,
  settings,
  recentLists,
  onInputChange,
  onSettingsChange,
  onUseRecent,
  onEditRecent,
  onDeleteRecent,
  onShareRecent,
  editingRecentKey,
  shareHelp,
  shareStatus,
  shareUrl,
  onCloseSharePanel,
  onCopyShareLink,
  onShare,
  onStart,
}: SetupPageProps) {
  const preview = getCharacterPreview(inputText);
  const canStart = preview.length > 0;

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
          <p>{preview.length > 0 ? `${preview.length} 个字` : "录入本次字表"}</p>
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
            {preview.length === 0 ? (
              <span className="empty-preview">等待录入</span>
            ) : (
              preview.map((char) => (
                <span className="character-chip" key={char}>
                  {char}
                </span>
              ))
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
          {shareUrl ? (
            <div className="share-panel">
              <div className="share-panel-heading">
                <Share2 aria-hidden="true" size={18} />
                <span>分享链接</span>
              </div>
              <textarea
                aria-label="分享链接"
                className="share-link-field"
                readOnly
                value={shareUrl}
                onFocus={(event) => event.currentTarget.select()}
                onClick={(event) => event.currentTarget.select()}
              />
              {shareHelp ? <div className="share-help">{shareHelp}</div> : null}
              <div className="share-panel-actions">
                <Button icon={Copy} variant="quiet" onClick={onCopyShareLink}>
                  复制
                </Button>
                <Button icon={ChevronUp} variant="quiet" onClick={onCloseSharePanel}>
                  收起
                </Button>
              </div>
            </div>
          ) : null}
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
                {recentLists.map((chars) => {
                  const key = getRecentListKey(chars);
                  const text = joinCharacters(chars);

                  return (
                    <div className="recent-item" data-editing={editingRecentKey === key} key={key}>
                      <button
                        className="recent-main-action"
                        title="使用"
                        type="button"
                        onClick={() => onUseRecent(chars)}
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
                          onClick={() => onEditRecent(chars)}
                        >
                          <Pencil aria-hidden="true" size={18} />
                        </button>
                        <button
                          aria-label={`分享字表 ${text}`}
                          className="recent-icon-action"
                          title="分享"
                          type="button"
                          onClick={() => onShareRecent(chars)}
                        >
                          <Share2 aria-hidden="true" size={18} />
                        </button>
                        <button
                          aria-label={`删除字表 ${text}`}
                          className="recent-icon-action recent-icon-action--danger"
                          title="删除"
                          type="button"
                          onClick={() => onDeleteRecent(chars)}
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
