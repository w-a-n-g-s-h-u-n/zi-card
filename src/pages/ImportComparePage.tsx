import { Download, Home } from "lucide-react";
import { Button } from "../ui/Button";
import { CharacterChip } from "../ui/CharacterChip";
import type { CharacterDraft } from "../types/character";

type ImportComparePageProps = {
  importType: "characters" | "result";
  localDrafts: CharacterDraft[];
  sharedDrafts: CharacterDraft[];
  onKeepLocal: () => void;
  onUseShared: () => void;
};

export function ImportComparePage({
  importType,
  localDrafts,
  sharedDrafts,
  onKeepLocal,
  onUseShared,
}: ImportComparePageProps) {
  const subtitle =
    importType === "result"
      ? "这个分享结果对应的字表，和本地已有字表的顺序不一致。"
      : "这个分享字表，和本地已有字表的顺序不一致。";

  return (
    <section className="import-compare-page" aria-labelledby="import-compare-title">
      <header className="import-compare-hero">
        <div>
          <p className="import-compare-kicker">分享导入</p>
          <h1 id="import-compare-title">选择字表版本</h1>
          <p>{subtitle}</p>
        </div>
      </header>

      <main className="import-compare-grid">
        <DraftComparePanel title="本地字表" description="保留你当前设备里的顺序。" drafts={localDrafts} />
        <DraftComparePanel title="分享字表" description="使用链接里的顺序，并同步更新本地缓存。" drafts={sharedDrafts} />
      </main>

      <footer className="import-compare-actions">
        <Button icon={Home} variant="secondary" onClick={onKeepLocal}>
          保留本地
        </Button>
        <Button icon={Download} variant="primary" onClick={onUseShared}>
          使用分享
        </Button>
      </footer>
    </section>
  );
}

type DraftComparePanelProps = {
  title: string;
  description: string;
  drafts: CharacterDraft[];
};

function DraftComparePanel({ title, description, drafts }: DraftComparePanelProps) {
  return (
    <section className="import-compare-panel" aria-label={title}>
      <div className="import-compare-panel-header">
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        <span>{drafts.length} 字</span>
      </div>
      <div className="import-compare-list">
        {drafts.map((draft, index) => (
          <div className="import-compare-item" key={`${draft.char}-${draft.pinyin ?? ""}-${index}`}>
            <span aria-hidden="true">{index + 1}</span>
            <CharacterChip char={draft.char} showPinyin={false} />
          </div>
        ))}
      </div>
    </section>
  );
}
