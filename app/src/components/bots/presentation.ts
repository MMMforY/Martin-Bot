export interface PresentationBot {
  id: string;
  name: string;
  title: string | null;
  roleDescription: string | null;
}

export function matchesBot(bot: PresentationBot, query: string) {
  const phrase = query.trim().toLocaleLowerCase();
  return [bot.name, bot.title, bot.roleDescription].some((text) =>
    text?.toLocaleLowerCase().includes(phrase),
  );
}

function escapeText(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

/** A portable document: export only the three fields printed on a card. */
export function presentationHtml(bots: readonly PresentationBot[]) {
  const slides = bots
    .map(
      (bot, index) => `
    <section ${index ? "hidden" : ""} aria-label="Bot ${index + 1}">
      <p class="counter">BOT &nbsp; ${String(index + 1).padStart(2, "0")} / ${String(bots.length).padStart(2, "0")}</p>
      <h1>${escapeText(bot.name)}</h1>
      <h2>${escapeText(bot.title ?? "")}</h2>
      <p class="description">${escapeText(bot.roleDescription || "尚未填写职责说明。")}</p>
    </section>`,
    )
    .join("");
  return `<!doctype html>
<html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Martin Bot · 团队展示</title>
<style>
:root{color-scheme:light dark}*{box-sizing:border-box}body{margin:0;background:Canvas;color:CanvasText;font:18px/1.55 Inter,system-ui,sans-serif}
main{max-width:1100px;min-height:100svh;margin:auto;padding:clamp(24px,6vw,88px);display:flex;flex-direction:column}
header,footer{display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap}header{border-bottom:1px solid;padding-bottom:16px}header b{font-size:25px;letter-spacing:-1px}
section{margin:auto 0;padding:48px 0;overflow-wrap:anywhere}.counter,output{font:15px monospace}.counter{letter-spacing:.12em}
h1{font-size:clamp(36px,7vw,88px);line-height:1.08;margin:.35em 0;letter-spacing:-.035em}h2{font-size:clamp(18px,2.4vw,32px);font-weight:500}.description{max-width:60ch;white-space:pre-wrap}
footer{border-top:1px solid;padding-top:18px}button{font:inherit;padding:.35em .9em;border:1px solid;border-radius:6px;color:inherit;background:Canvas;cursor:pointer}button:disabled{opacity:.4}
@media print{section[hidden]{display:block}section{break-after:page}footer{display:none}main{display:block}}
</style><main><header><b>Martin Bot</b><span>团队展示</span></header>${slides}
<footer><output aria-live="polite">1 / ${bots.length}</output><div><button id="previous">上一页</button> <button id="next">下一页</button></div></footer></main>
<script>
const pages = Array.from(document.querySelectorAll("section"));
const previous = document.getElementById("previous");
const next = document.getElementById("next");
let current = 0;
function show(i) {
  pages[current].hidden = true;
  current = Math.max(0, Math.min(pages.length - 1, i));
  pages[current].hidden = false;
  previous.disabled = current === 0;
  next.disabled = current === pages.length - 1;
  document.querySelector("output").textContent = (current + 1) + " / " + pages.length;
}
previous.onclick = () => show(current - 1);
next.onclick = () => show(current + 1);
document.addEventListener("keydown", e => {
  if (e.key === "ArrowLeft") show(current - 1);
  if (e.key === "ArrowRight") show(current + 1);
});
show(0);
</script></html>`;
}
