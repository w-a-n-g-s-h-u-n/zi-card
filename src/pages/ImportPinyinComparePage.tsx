import { PolyphonicReadingEditor } from "./setup/PolyphonicReadingEditor";
import type { ImportPinyinConflict } from "../storage/localStorage";

type ImportPinyinComparePageProps = {
  importType: "characters" | "result";
  conflicts: ImportPinyinConflict[];
  onSelectPinyin: (char: string, source: "local" | "shared") => void;
};

export function ImportPinyinComparePage({
  importType,
  conflicts,
  onSelectPinyin,
}: ImportPinyinComparePageProps) {
  const subtitle =
    importType === "result"
      ? "这个分享结果里有和本地不同的读音。"
      : "这个分享字表里有和本地不同的读音。";

  return (
    <section className="import-compare-page import-pinyin-page" aria-labelledby="import-pinyin-title">
      <header className="import-compare-hero">
        <div>
          <p className="import-compare-kicker">分享导入</p>
          <h1 id="import-pinyin-title">选择不同读音</h1>
          <p>{subtitle}</p>
        </div>
        <span className="import-pinyin-count">{conflicts.length} 个</span>
      </header>

      <main className="import-pinyin-list">
        {conflicts.map((conflict) => (
          <section className="import-pinyin-row" key={conflict.char} aria-label={`${conflict.char} 的读音`}>
            <PolyphonicReadingEditor
              item={{
                char: conflict.char,
                pinyinOptions: [conflict.localPinyin, conflict.sharedPinyin],
              }}
              showPinyin={false}
              getPinyinOrigin={(pinyin) => (pinyin === conflict.localPinyin ? "local" : "shared")}
              onPinyinChange={(_, pinyin) =>
                onSelectPinyin(conflict.char, pinyin === conflict.localPinyin ? "local" : "shared")
              }
            />
          </section>
        ))}
      </main>
    </section>
  );
}
