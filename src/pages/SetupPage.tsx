import {
  BookOpenText,
  CheckCircle2,
  Dice5,
  Eye,
  ListRestart,
  Pencil,
  Play,
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
  editingRecentKey: string | null;
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
  editingRecentKey,
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

          <Button icon={Play} size="large" disabled={!canStart} onClick={onStart}>
            开始
          </Button>
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
