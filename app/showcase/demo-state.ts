import type { PresentationBot } from "../src/components/bots/presentation";

export type TeamBot = PresentationBot & { tone: number };
export type Status = "待审批" | "已完成" | "已拒绝";
export type Task = {
  id: string;
  name: string;
  botId: string;
  source: string;
  report: boolean;
  status: Status;
};
export type Event = { time: number; text: string };
export type Workspace = { bots: TeamBot[]; tasks: Task[]; events: Event[] };

export function initialWorkspace(): Workspace {
  const now = Date.now();
  const bots = [
    {
      id: "research",
      name: "资料研究",
      title: "研究与检索",
      roleDescription: "整理来源材料，提取可核对的要点。",
      tone: 0,
    },
    {
      id: "customer",
      name: "客户支持",
      title: "客户运营",
      roleDescription: "归集客户反馈，准备回复用的材料。",
      tone: 1,
    },
    {
      id: "project",
      name: "项目跟进",
      title: "项目管理",
      roleDescription: "汇总项目进展，列出团队接下来的工作。",
      tone: 2,
    },
  ];
  const tasks: Task[] = [
    {
      id: "feedback",
      name: "汇总本轮客户反馈",
      botId: "customer",
      source:
        "客户希望在列表中按职责搜索。\n移动端需要更大的翻页按钮。\n两位客户希望导出介绍资料。",
      report: true,
      status: "待审批",
    },
    {
      id: "release",
      name: "整理版本发布要点",
      botId: "research",
      source: "新增工作区搜索。\n支持离线演示。",
      report: false,
      status: "已完成",
    },
    {
      id: "launch",
      name: "核对发布准备事项",
      botId: "project",
      source: "确认负责人。\n完成投屏彩排。",
      report: false,
      status: "已完成",
    },
  ];
  return {
    bots,
    tasks,
    events: [
      {
        time: now - 120000,
        text: "客户支持申请生成《汇总本轮客户反馈》的报告文件。",
      },
      { time: now - 240000, text: "资料研究完成了《整理版本发布要点》。" },
      { time: now - 480000, text: "项目跟进完成了《核对发布准备事项》。" },
    ],
  };
}

export const storageKey = "martin-workspace-preview-0.3";
export function loadWorkspace(): Workspace {
  try {
    const saved = JSON.parse(
      localStorage.getItem(storageKey) || "null",
    ) as Workspace | null;
    if (
      saved &&
      Array.isArray(saved.bots) &&
      saved.bots.length &&
      Array.isArray(saved.tasks) &&
      Array.isArray(saved.events)
    )
      return saved;
  } catch {
    /* Opening a local file in private browsing can disable storage. */
  }
  return initialWorkspace();
}

export function taskResult(task: Task) {
  const items = task.source
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  return items.map((text, index) => index + 1 + ". " + text).join("\n");
}
