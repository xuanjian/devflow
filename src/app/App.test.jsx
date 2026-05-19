import { render, screen, waitFor } from "@testing-library/react";
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
        { id: "skill:demo", type: "skill", title: "Demo Skill", status: "ok" },
        { id: "task:demo", type: "task", title: "Demo Task", status: "ok", raw: { currentGate: "G4", status: "doing", projectIds: ["demo"] } }
      ],
      edges: [{ from: "project:demo", to: "skill:demo", relation: "uses-skill" }],
      groups: [],
      warnings: []
    }) });

  render(<App />);

  expect(screen.getByText("上下文工作台")).toBeInTheDocument();
  expect(await screen.findByText("全局关系")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "关系" })).toHaveClass("active");
  expect(screen.getByRole("button", { name: "任务" })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "总览" })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "画像" })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "检查" })).not.toBeInTheDocument();
  expect(screen.queryByPlaceholderText("搜索节点、文件或说明")).not.toBeInTheDocument();
});

test("App relation view hides structural root and group nodes", async () => {
  global.fetch = vi.fn()
    .mockResolvedValueOnce({ ok: true, json: async () => ({
      nodes: [
        { id: "root:context-index", type: "root", title: "上下文索引", status: "ok" },
        { id: "group:projects", type: "group", title: "Projects", status: "ok" },
        { id: "group:scenes", type: "group", title: "Scenes", status: "ok" },
        { id: "group:skills", type: "group", title: "Skills", status: "ok" },
        { id: "group:rules", type: "group", title: "Rules", status: "ok" },
        { id: "project:demo", type: "project", title: "Demo Project", status: "ok" },
        { id: "scene:demo", type: "scene", title: "Demo Scene", status: "ok" },
        { id: "skill:demo", type: "skill", title: "Demo Skill", status: "ok" },
        { id: "rule:demo", type: "rule", title: "Demo Rule", status: "ok" }
      ],
      edges: [
        { from: "root:context-index", to: "group:projects", relation: "contains" },
        { from: "root:context-index", to: "group:scenes", relation: "contains" }
      ],
      groups: [],
      warnings: []
    }) });

  render(<App />);

  await screen.findByText("全局关系");

  expect(screen.getByRole("button", { name: "Demo Project 项目" })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "项目 分组" })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "场景 分组" })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "技能 分组" })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "规则 分组" })).not.toBeInTheDocument();
  await waitFor(() => expect(screen.queryByRole("button", { name: "上下文索引根节点" })).not.toBeInTheDocument());
});
