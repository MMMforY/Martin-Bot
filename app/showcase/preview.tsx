import { createRoot } from "react-dom/client";
import { PresentationPicker } from "../src/components/bots/presentation-picker";

const bots = [
  {
    id: "research",
    name: "资料研究",
    title: "研究与检索",
    roleDescription: "从已连接的资料中找到依据，整理成带出处的答复。",
  },
  {
    id: "customer",
    name: "客户支持",
    title: "客户运营",
    roleDescription: "梳理客户反馈，归纳常见问题，准备回复草稿。",
  },
  {
    id: "project",
    name: "项目跟进",
    title: "项目管理",
    roleDescription: "整理项目进度，列出需要团队协调的下一步工作。",
  },
];

createRoot(document.getElementById("root")!).render(
  <PresentationPicker bots={bots} />,
);
