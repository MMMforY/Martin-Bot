import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { createRoot } from "react-dom/client";
import {
  IconLayoutDashboard,
  IconRobot,
  IconStack2,
  IconShieldCheck,
  IconHistory,
  IconPresentation,
  IconBook2,
  IconArrowUpRight,
  IconArrowRight,
  IconPlus,
  IconSearch,
  IconX,
  IconRotate,
  IconFileText,
  IconChecks,
  IconRadar,
  IconMenu2,
  IconDownload,
  IconMessage,
  IconRoute,
  IconWorld,
  IconActivity,
  IconChevronRight,
} from "@tabler/icons-react";
import { PresentationPicker } from "../src/components/bots/presentation-picker";
import { matchesBot } from "../src/components/bots/presentation";
import {
  initialWorkspace,
  loadWorkspace,
  storageKey,
  taskResult,
  type Task,
  type TeamBot,
  type Workspace,
} from "./demo-state";

const pages = [
  { name: "工作区总览", icon: IconLayoutDashboard },
  { name: "Bot 目录", icon: IconRobot },
  { name: "任务中心", icon: IconStack2 },
  { name: "审批收件箱", icon: IconShieldCheck },
  { name: "活动记录", icon: IconHistory },
  { name: "团队展示", icon: IconPresentation },
];
const marks = [IconRadar, IconMessage, IconRoute];
function Avatar({ bot }: { bot: TeamBot }) {
  const Mark = marks[bot.tone % marks.length];
  return (
    <span className={"avatar tone" + (bot.tone % 3)}>
      <Mark size={21} />
    </span>
  );
}
function Pill({ status }: { status: Task["status"] }) {
  return (
    <span className={"pill s" + { 待审批: 0, 已完成: 1, 已拒绝: 2 }[status]}>
      {status}
    </span>
  );
}
function Signal() {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const ctx = canvas.current?.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, 600, 260);
    // A halftone torus, plotted back to front to keep the inner and outer contours distinct.
    const points: { x: number; y: number; z: number }[] = [];
    for (let i = 0; i < 96; i++)
      for (let j = 0; j < 32; j++) {
        const u = (i * Math.PI) / 48,
          v = (j * Math.PI) / 16,
          r = 76 + 31 * Math.cos(v);
        const x = r * Math.cos(u),
          y = r * Math.sin(u),
          z = 31 * Math.sin(v);
        const tilt = y * 0.43 - z * 0.9;
        points.push({
          x: 320 + (x * 0.9 - tilt * 0.44) * 1.95,
          y: 131 + (x * 0.44 + tilt * 0.9) * 1.3,
          z: y * 0.9 + z * 0.43,
        });
      }
    for (const p of points.sort((a, b) => a.z - b.z)) {
      const a = (p.z + 110) / 220;
      ctx.fillStyle = "rgba(190,246,117," + (0.12 + 0.85 * a) + ")";
      ctx.beginPath();
      ctx.arc(p.x, p.y, 0.7 + 1.65 * a, 0, Math.PI * 2);
      ctx.fill();
    }
  }, []);
  return (
    <canvas
      className="signal"
      width="600"
      height="260"
      ref={canvas}
      aria-hidden="true"
    />
  );
}
function Modal({
  title,
  close,
  children,
}: {
  title: string;
  close: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  return (
    <dialog ref={ref} aria-label={title} onCancel={close}>
      <div className="modalhead">
        <h2>{title}</h2>
        <button className="iconbtn" onClick={close} aria-label="关闭">
          <IconX />
        </button>
      </div>
      {children}
    </dialog>
  );
}
type Dialog =
  | { kind: "bot" }
  | { kind: "task"; botId?: string }
  | { kind: "detail"; id: string }
  | { kind: "reset" };
function App() {
  const [ws, setWs] = useState(loadWorkspace);
  const [page, setPage] = useState(0),
    [dialog, setDialog] = useState<Dialog | null>(null),
    [drawer, setDrawer] = useState(false);
  const [query, setQuery] = useState(""),
    [filter, setFilter] = useState("全部"),
    [saved, setSaved] = useState(true);
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(ws));
      setSaved(true);
    } catch {
      setSaved(false);
    }
  }, [ws]);
  const navigate = (i: number) => {
    setPage(i);
    setDrawer(false);
    setFilter("全部");
    window.scrollTo(0, 0);
  };
  const botOf = (id: string) => ws.bots.find((b) => b.id === id)!;
  const pending = ws.tasks.filter((t) => t.status === "待审批");
  function log(old: Workspace, text: string) {
    return [{ time: Date.now(), text }, ...old.events];
  }
  function addBot(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const name = String(data.get("name")).trim(),
      role = String(data.get("role")).trim();
    if (!name || !role) {
      const field = e.currentTarget.elements.namedItem(
        !name ? "name" : "role",
      ) as HTMLInputElement | HTMLTextAreaElement;
      field.setCustomValidity("请填写有效内容。");
      field.reportValidity();
      field.setCustomValidity("");
      return;
    }
    const bot = {
      id: crypto.randomUUID(),
      name,
      roleDescription: role,
      title: String(data.get("title")).trim(),
      tone: ws.bots.length % 3,
    };
    setWs((old) => ({
      ...old,
      bots: [...old.bots, bot],
      events: log(old, "创建了 Bot「" + name + "」。"),
    }));
    setQuery("");
    navigate(1);
    setDialog(null);
  }
  function addTask(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const name = String(data.get("name")).trim(),
      source = String(data.get("source")).trim();
    if (!name || !source) {
      const field = e.currentTarget.elements.namedItem(
        !name ? "name" : "source",
      ) as HTMLInputElement | HTMLTextAreaElement;
      field.setCustomValidity("请填写有效内容。");
      field.reportValidity();
      field.setCustomValidity("");
      return;
    }
    const report = data.get("output") === "report";
    const task: Task = {
      id: crypto.randomUUID(),
      name,
      source,
      report,
      botId: String(data.get("bot")),
      status: report ? "待审批" : "已完成",
    };
    setWs((old) => ({
      ...old,
      tasks: [task, ...old.tasks],
      events: log(
        old,
        botOf(task.botId).name +
          (report ? "申请生成" : "完成了") +
          "《" +
          name +
          "》" +
          (report ? "的报告文件。" : "。"),
      ),
    }));
    navigate(2);
    setDialog({ kind: "detail", id: task.id });
  }
  function decide(id: string, allow: boolean) {
    setWs((old) => {
      const task = old.tasks.find((t) => t.id === id);
      if (!task || task.status !== "待审批") return old;
      return {
        ...old,
        tasks: old.tasks.map((t) =>
          t.id === id ? { ...t, status: allow ? "已完成" : "已拒绝" } : t,
        ),
        events: log(
          old,
          (allow ? "已批准" : "已拒绝") +
            "《" +
            task.name +
            "》的文件生成请求。",
        ),
      };
    });
  }
  function download(task: Task) {
    const url = URL.createObjectURL(
      new Blob(
        [task.name + "\n" + botOf(task.botId).name + "\n\n" + taskResult(task)],
        { type: "text/plain;charset=utf-8" },
      ),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download =
      "Martin Bot - " + task.name.replace(/[^\p{L}\p{N} -]/gu, "_") + ".txt";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
    setWs((old) => ({
      ...old,
      events: log(old, "已导出《" + task.name + "》的报告文件。"),
    }));
  }
  function rows(tasks: Task[]) {
    return tasks.length ? (
      tasks.map((task) => (
        <button
          className="taskrow"
          key={task.id}
          onClick={() => setDialog({ kind: "detail", id: task.id })}
        >
          <span className="file">
            <IconFileText size={19} />
          </span>
          <span className="grow">
            <b>{task.name}</b>
            <small>{botOf(task.botId).name}</small>
          </span>
          <Pill status={task.status} />
          <IconChevronRight size={16} />
        </button>
      ))
    ) : (
      <p className="empty">这里暂无任务。</p>
    );
  }
  const selected =
    dialog?.kind === "detail"
      ? ws.tasks.find((t) => t.id === dialog.id)
      : undefined;
  return (
    <div className="shell">
      {drawer && (
        <button
          aria-label="收起导航"
          className="veil"
          onClick={() => setDrawer(false)}
        />
      )}
      <aside className={drawer ? "open" : ""}>
        <div className="brand">
          <span className="brandmark">M</span>Martin Bot
        </div>
        <div className="railtitle">WORKSPACE</div>
        <nav>
          {pages.map(({ name, icon: Icon }, i) => (
            <button
              className={page === i ? "active" : ""}
              aria-current={page === i ? "page" : undefined}
              key={name}
              onClick={() => navigate(i)}
            >
              <Icon size={19} />
              {name}
              {i === 3 && pending.length > 0 && <em>{pending.length}</em>}
            </button>
          ))}
        </nav>
        <div className="railfoot">
          <a href="guide.html" target="_blank" rel="noopener">
            <IconBook2 size={18} />
            演示指南
            <IconArrowUpRight size={14} />
          </a>
          <button
            onClick={() => {
              setDrawer(false);
              setDialog({ kind: "reset" });
            }}
          >
            <IconRotate size={17} />
            重置演示
          </button>
          <small>MARTIN BOT &nbsp; / &nbsp; v0.3</small>
        </div>
      </aside>
      <main>
        <header>
          <button
            className="mobile iconbtn"
            aria-label="展开导航"
            onClick={() => setDrawer(true)}
          >
            <IconMenu2 />
          </button>
          <div>
            Martin Workspace <span>/</span> <b>{pages[page].name}</b>
          </div>
          <small className="env">
            <i />
            离线演示
          </small>
        </header>
        <div className="body">
          {page === 0 ? (
            <>
              <section className="hero">
                <div className="herotext">
                  <small>OPERATIONS CONSOLE</small>
                  <h1>工作区总览</h1>
                  <p>管理团队中的 Bot，查看任务与审批进度。</p>
                  <button
                    className="lime"
                    onClick={() => setDialog({ kind: "task" })}
                  >
                    <IconPlus size={17} />
                    分派任务
                  </button>
                </div>
                <Signal />
              </section>
              <div className="stats">
                {[
                  [ws.bots.length, "工作区 Bot", IconRobot, 1],
                  [ws.tasks.length, "任务总数", IconStack2, 2],
                  [pending.length, "等待审批", IconShieldCheck, 3],
                  [
                    ws.tasks.filter((t) => t.status === "已完成").length,
                    "已完成任务",
                    IconChecks,
                    2,
                  ],
                ].map(([n, label, I, dest]) => {
                  const Icon = I as typeof IconRobot;
                  return (
                    <button
                      key={String(label)}
                      className="stat"
                      onClick={() => {
                        navigate(Number(dest));
                        if (label === "已完成任务") setFilter("已完成");
                      }}
                    >
                      <span>
                        <Icon size={17} />
                        {String(label)}
                      </span>
                      <b>{String(n).padStart(2, "0")}</b>
                      <IconArrowUpRight className="jump" size={15} />
                    </button>
                  );
                })}
              </div>
              <div className="columns">
                <section className="panel">
                  <div className="panelhead">
                    <h2>最近任务</h2>
                    <button className="textbtn" onClick={() => navigate(2)}>
                      查看全部 <IconArrowRight size={15} />
                    </button>
                  </div>
                  {rows(ws.tasks.slice(0, 4))}
                </section>
                <section className="panel">
                  <div className="panelhead">
                    <h2>团队成员</h2>
                    <button
                      className="iconbtn"
                      aria-label="新建 Bot"
                      onClick={() => setDialog({ kind: "bot" })}
                    >
                      <IconPlus size={18} />
                    </button>
                  </div>
                  {ws.bots.slice(-3).map((b) => (
                    <button
                      key={b.id}
                      className="member"
                      onClick={() => setDialog({ kind: "task", botId: b.id })}
                    >
                      <Avatar bot={b} />
                      <span className="grow">
                        <b>{b.name}</b>
                        <small>{b.title || "自定义 Bot"}</small>
                      </span>
                      <IconArrowUpRight size={16} />
                    </button>
                  ))}
                </section>
              </div>
            </>
          ) : (
            <div className="pagehead">
              <div>
                <small className="eyebrow">MARTIN WORKSPACE</small>
                <h1>{pages[page].name}</h1>
              </div>
              {page === 1 ? (
                <button
                  className="dark"
                  onClick={() => setDialog({ kind: "bot" })}
                >
                  <IconPlus size={17} />
                  新建 Bot
                </button>
              ) : page === 2 ? (
                <button
                  className="dark"
                  onClick={() => setDialog({ kind: "task" })}
                >
                  <IconPlus size={17} />
                  分派任务
                </button>
              ) : null}
            </div>
          )}
          {page === 1 && (
            <>
              <div className="search">
                <IconSearch size={18} />
                <input
                  type="search"
                  aria-label="查找 Bot"
                  placeholder="搜索名称、标题或职责"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <div className="cards">
                {ws.bots
                  .filter((b) => matchesBot(b, query))
                  .map((b) => (
                    <article className="botcard" key={b.id}>
                      <Avatar bot={b} />
                      <small>{b.title || "自定义 Bot"}</small>
                      <h2>{b.name}</h2>
                      <p>{b.roleDescription}</p>
                      <button
                        className="soft"
                        onClick={() => setDialog({ kind: "task", botId: b.id })}
                      >
                        分派任务 <IconArrowRight size={15} />
                      </button>
                    </article>
                  ))}
              </div>
              {!ws.bots.some((b) => matchesBot(b, query)) && (
                <p className="empty">没有匹配的 Bot。</p>
              )}
            </>
          )}
          {page === 2 && (
            <section className="panel">
              <div className="tabs">
                {["全部", "待审批", "已完成", "已拒绝"].map((x) => (
                  <button
                    aria-pressed={filter === x}
                    onClick={() => setFilter(x)}
                    key={x}
                  >
                    {x}
                  </button>
                ))}
              </div>
              {rows(
                ws.tasks.filter(
                  (t) => filter === "全部" || t.status === filter,
                ),
              )}
            </section>
          )}
          {page === 3 && (
            <section className="panel">
              <div className="panelhead">
                <h2>待处理请求</h2>
                <small>{pending.length} 项</small>
              </div>
              {pending.length ? (
                rows(pending)
              ) : (
                <p className="empty">
                  请求已处理完。分派需要生成报告的任务，就会在这里收到审批请求。
                </p>
              )}
            </section>
          )}
          {page === 4 && (
            <section className="panel">
              <div className="panelhead">
                <h2>工作区事件</h2>
                <IconActivity size={19} />
              </div>
              {ws.events.map((e, i) => (
                <div className="event" key={i}>
                  <i />
                  <time>
                    {new Date(e.time).toLocaleString("zh-CN", {
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </time>
                  <span>{e.text}</span>
                </div>
              ))}
            </section>
          )}
          {page === 5 && (
            <div className="picker">
              <PresentationPicker bots={ws.bots} />
            </div>
          )}
          <footer>
            <span>
              <IconWorld size={14} /> 浏览器本地工作区
            </span>
            <span>
              {saved ? "修改保存在当前浏览器" : "当前浏览器仅保留本次会话"} ·
              示例任务按行整理素材
            </span>
          </footer>
        </div>
      </main>
      {dialog?.kind === "bot" && (
        <Modal close={() => setDialog(null)} title="创建 Bot">
          <form onSubmit={addBot}>
            <label>
              名称
              <input
                required
                autoFocus
                maxLength={40}
                name="name"
                pattern=".*\S.*"
                placeholder="例如：发布协调"
              />
            </label>
            <label>
              岗位标题
              <input name="title" maxLength={60} placeholder="例如：发布管理" />
            </label>
            <label>
              职责
              <textarea
                name="role"
                required
                maxLength={400}
                placeholder="这个 Bot 负责什么？"
              />
            </label>
            <button className="dark">创建 Bot</button>
          </form>
        </Modal>
      )}
      {dialog?.kind === "task" && (
        <Modal close={() => setDialog(null)} title="分派任务">
          <form onSubmit={addTask}>
            <label>
              指派给
              <select name="bot" defaultValue={dialog.botId || ws.bots[0].id}>
                {ws.bots.map((b) => (
                  <option value={b.id} key={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              任务名称
              <input
                name="name"
                autoFocus
                required
                maxLength={72}
                defaultValue="整理演示反馈"
              />
            </label>
            <label>
              原始素材 · 每行一个要点
              <textarea
                name="source"
                required
                maxLength={6000}
                defaultValue={
                  "现场演示需要展示审批过程。\n资料包需要支持离线打开。"
                }
              />
            </label>
            <label>
              交付方式
              <select name="output">
                <option value="report">生成报告文件 · 需要审批</option>
                <option value="read">仅整理清单 · 直接完成</option>
              </select>
            </label>
            <small>演示会把输入逐行整理为编号清单。</small>
            <button className="dark">
              提交任务 <IconArrowRight size={16} />
            </button>
          </form>
        </Modal>
      )}
      {selected && (
        <Modal close={() => setDialog(null)} title={selected.name}>
          <div className="detailmeta">
            <Avatar bot={botOf(selected.botId)} />
            <b>{botOf(selected.botId).name}</b>
            <Pill status={selected.status} />
          </div>
          <h3>原始素材</h3>
          <pre>{selected.source}</pre>
          {selected.status === "待审批" ? (
            <>
              <h3>申请操作</h3>
              <p>允许此 Bot 将素材整理为可下载的文本报告？</p>
              <div className="actions">
                <button
                  className="soft"
                  onClick={() => decide(selected.id, false)}
                >
                  拒绝
                </button>
                <button
                  className="dark"
                  onClick={() => decide(selected.id, true)}
                >
                  批准生成报告
                </button>
              </div>
            </>
          ) : selected.status === "已完成" ? (
            <>
              <h3>整理结果</h3>
              <pre>{taskResult(selected)}</pre>
              {selected.report && (
                <button className="dark" onClick={() => download(selected)}>
                  <IconDownload size={17} />
                  下载报告
                </button>
              )}
            </>
          ) : (
            <p>文件生成请求已拒绝。</p>
          )}
        </Modal>
      )}
      {dialog?.kind === "reset" && (
        <Modal title="恢复初始演示？" close={() => setDialog(null)}>
          <p>这会清除本页创建的 Bot、任务和事件，恢复三条示例任务。</p>
          <div className="actions">
            <button className="soft" onClick={() => setDialog(null)}>
              取消
            </button>
            <button
              className="dark"
              onClick={() => {
                setWs(initialWorkspace());
                setQuery("");
                navigate(0);
                setDialog(null);
              }}
            >
              恢复示例
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
createRoot(document.getElementById("root")!).render(<App />);
