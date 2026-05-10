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
        { id: "task:demo", type: "task", title: "Demo Task", status: "ok", raw: { currentGate: "G4", status: "doing", projectIds: ["demo"] } },
        { id: "profile:main", type: "profile", title: "Persona Profile", status: "ok", raw: { role: "Developer", products: ["DHB"], strengths: ["React"] }, docPath: "docs/person/profile.md" }
      ],
      edges: [],
      groups: [],
      warnings: []
    }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ checks: [] }) });

  render(<App />);

  expect(screen.getByText("上下文工作台")).toBeInTheDocument();
  expect(await screen.findByText("安装与 AI 工具配置")).toBeInTheDocument();
  expect(screen.getByText("工作流与 Tasks")).toBeInTheDocument();
});

test("App relation view hides the root node and starts with four relation groups", async () => {
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
    }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ checks: [] }) });

  render(<App />);

  await screen.findByText("安装与 AI 工具配置");
  await userEvent.click(screen.getByRole("button", { name: "关系" }));

  expect(screen.getByRole("button", { name: "项目分组" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "场景分组" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "技能分组" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "规则分组" })).toBeInTheDocument();
  await waitFor(() => expect(screen.queryByRole("button", { name: "上下文索引根节点" })).not.toBeInTheDocument());
});
