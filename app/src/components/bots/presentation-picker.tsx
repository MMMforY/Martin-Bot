import { useState } from "react";
import {
  matchesBot,
  presentationHtml,
  type PresentationBot,
} from "./presentation";

/** Selection is scoped to this mount and reconciled against the current visible roster at export. */
export function PresentationPicker({
  bots,
}: {
  bots: readonly PresentationBot[];
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [notice, setNotice] = useState("");
  const visible = bots.filter((bot) => matchesBot(bot, query));
  const byId = new Map(bots.map((bot) => [bot.id, bot]));
  const lineup = selected.flatMap((id) => byId.get(id) ?? []);

  function toggle(id: string) {
    setSelected((ids) =>
      ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id],
    );
    setNotice("");
  }

  function download() {
    if (!lineup.length) return;
    const file = new Blob([presentationHtml(lineup)], {
      type: "text/html;charset=utf-8",
    });
    const url = URL.createObjectURL(file);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "Martin-Bot-团队展示.html";
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
    setNotice("展示文件已生成，请从浏览器下载中打开。");
  }

  return (
    <section
      className="space-y-4 rounded-xl border border-border bg-card p-5"
      aria-label="团队展示"
    >
      <div>
        <h2 className="font-semibold text-lg">团队展示</h2>
        <p className="text-sm text-muted-foreground">
          按讲解顺序选择 Bot。展示文件包含名称、标题和职责，可离线翻页。
        </p>
      </div>
      <input
        type="search"
        aria-label="查找 Bot"
        placeholder="按名称、标题或职责查找"
        value={query}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        onChange={(event) => setQuery(event.target.value)}
      />
      <div className="max-h-72 overflow-y-auto rounded-md border border-border">
        {visible.map((bot) => (
          <label
            key={bot.id}
            className="flex cursor-pointer items-start gap-3 border-b border-border p-3 last:border-0"
          >
            <input
              type="checkbox"
              checked={selected.includes(bot.id)}
              onChange={() => toggle(bot.id)}
              className="mt-1"
            />
            <span className="min-w-0 break-words">
              <strong>{bot.name}</strong>
              <span className="block text-sm text-muted-foreground">
                {bot.roleDescription || bot.title}
              </span>
            </span>
          </label>
        ))}
        {!visible.length && (
          <p className="p-3 text-sm">
            {bots.length
              ? "没有匹配的 Bot，请换个关键词。"
              : "当前目录中还没有 Bot。"}
          </p>
        )}
      </div>
      <p className="text-sm" aria-live="polite">
        {lineup.length
          ? lineup.map((bot) => bot.name).join(" → ")
          : "请选择要展示的 Bot。"}
      </p>
      <button
        type="button"
        disabled={!lineup.length}
        onClick={download}
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
      >
        导出展示 HTML（{lineup.length}）
      </button>
      {notice && (
        <p className="text-sm text-muted-foreground" role="status">
          {notice}
        </p>
      )}
    </section>
  );
}
