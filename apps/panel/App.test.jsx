import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";
import App from "./App.jsx";

afterEach(() => {
  vi.restoreAllMocks();
});

test("App renders loading state then main regions", async () => {
  global.fetch = vi.fn()
    .mockResolvedValueOnce({ ok: true, json: async () => ({
      nodes: [
        { id: "project:demo", type: "project", title: "Demo Project", status: "ok" },
        { id: "task:demo", type: "task", title: "Demo Task", status: "ok", raw: { currentGate: "G4", status: "doing", projectIds: ["demo"] } },
        { id: "profile:main", type: "profile", title: "Persona Profile", status: "ok", raw: { role: "Developer", products: ["DemoProduct"], strengths: ["React"] }, docPath: "docs/person/profile.md" }
      ],
      edges: [],
      groups: [],
      warnings: []
    }) });

  render(<App />);

  expect(screen.getByText("上下文工作台")).toBeInTheDocument();
  expect(await screen.findByText("项目列表")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "筛选项目 Demo Project" })).toBeInTheDocument();
  expect(screen.getByTestId("graph-node-project:demo")).toBeInTheDocument();
  expect(screen.queryByText("安装与 AI 工具配置")).not.toBeInTheDocument();
  expect(screen.queryByText("搜索")).not.toBeInTheDocument();
});

test("App relation view hides the root node and starts with four relation groups", async () => {
  global.fetch = vi.fn()
    .mockResolvedValueOnce({ ok: true, json: async () => ({
      nodes: [
        { id: "root:context-index", type: "root", title: "上下文索引", status: "ok" },
        { id: "group:projects", type: "group", title: "Projects", status: "ok" },
        { id: "group:sceneTemplates", type: "group", title: "Scene Templates", status: "ok" },
        { id: "group:skills", type: "group", title: "Skills", status: "ok" },
        { id: "group:rules", type: "group", title: "Rules", status: "ok" },
        { id: "project:demo", type: "project", title: "Demo Project", status: "ok" },
        { id: "sceneTemplate:demo", type: "sceneTemplate", title: "Demo Scene", status: "ok" },
        { id: "skill:demo", type: "skill", title: "Demo Skill", status: "ok" },
        { id: "rule:demo", type: "rule", title: "Demo Rule", status: "ok" }
      ],
      edges: [
        { from: "root:context-index", to: "group:projects", relation: "contains" },
        { from: "root:context-index", to: "group:sceneTemplates", relation: "contains" },
        { from: "project:demo", to: "sceneTemplate:demo", relation: "uses-scene-template" }
      ],
      groups: [],
      warnings: []
    }) });

  render(<App />);

  await screen.findByText("项目列表");
  expect(screen.getByRole("button", { name: "筛选项目 Demo Project" })).toBeInTheDocument();
  expect(screen.getByTestId("edge-project:demo-sceneTemplate:demo-uses-scene-template")).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "任务" }));
  expect(screen.getByText("Tasks")).toBeInTheDocument();
});
