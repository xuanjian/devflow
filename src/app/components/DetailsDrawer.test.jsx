import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, test, vi } from "vitest";
import DetailsDrawer from "./DetailsDrawer.jsx";

beforeEach(() => {
  window.localStorage.clear();
});

test("DetailsDrawer renders metadata, relationships, warnings, and actions", async () => {
  const onRunAction = vi.fn();
  const details = {
    node: { id: "project:demo", title: "Demo", type: "project", status: "warning", sourcePath: "config/projects/demo.json", docPath: "docs/repos/demo.md", raw: { id: "demo" } },
    documentPreview: {
      title: "project.md",
      sourcePath: "docs/repos/demo.md",
      markdown: "# Demo\n\nProject doc preview.",
      truncated: false
    },
    documentationSummary: "Demo docs",
    related: { projects: [], scenes: [{ id: "scene:demo", title: "Scene" }], skills: [], rules: [], gates: [{ id: "gate:demo:G4", title: "G4 Development" }], profiles: [], tasks: [] },
    warnings: [{ code: "missing_project_doc", message: "Missing doc" }],
    actions: [{ actionId: "sync_project_entry", label: "Sync project", body: { projectId: "demo" } }]
  };

  render(<DetailsDrawer details={details} onRunAction={onRunAction} />);
  expect(screen.getByText("Demo")).toBeInTheDocument();
  expect(screen.getByText("Demo docs")).toBeInTheDocument();
  expect(screen.getByText("来源")).toBeInTheDocument();
  expect(screen.getByText("project.md")).toBeInTheDocument();
  expect(screen.getByText(/Project doc preview/)).toBeInTheDocument();
  expect(screen.getByText("关联场景")).toBeInTheDocument();
  expect(screen.getByText("关联步骤")).toBeInTheDocument();
  expect(screen.getByText("Missing doc")).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "Sync project" }));
  expect(onRunAction).toHaveBeenCalledWith("sync_project_entry", { projectId: "demo" });
  await userEvent.click(screen.getByRole("button", { name: "打开文档" }));
  expect(onRunAction).toHaveBeenCalledWith("open_document", { sourcePath: "docs/repos/demo.md", editor: "default" });
});

test("DetailsDrawer persists the selected document editor", async () => {
  const onRunAction = vi.fn();
  const details = {
    node: { id: "rule:demo", title: "Demo Rule", type: "rule", status: "ok", sourcePath: "bundles/rules/demo.md", raw: {} },
    documentPreview: {
      title: "rule 文档",
      sourcePath: "bundles/rules/demo.md",
      markdown: "# Rule"
    },
    related: {},
    warnings: [],
    actions: []
  };

  render(<DetailsDrawer details={details} onRunAction={onRunAction} />);
  await userEvent.selectOptions(screen.getByLabelText("编辑器"), "zed");
  await userEvent.click(screen.getByRole("button", { name: "打开文档" }));

  expect(onRunAction).toHaveBeenCalledWith("open_document", { sourcePath: "bundles/rules/demo.md", editor: "zed" });
});

test("DetailsDrawer renders gate artifacts as an editor-openable list", async () => {
  const onRunAction = vi.fn();
  const details = {
    node: {
      id: "gate:demo:G4",
      title: "G4 Development",
      type: "gate",
      status: "ok",
      raw: {
        artifacts: [
          { at: "2026-05-19T08:00:00.000Z", value: "src/app/components/DetailsDrawer.jsx", note: "UI artifact" },
          "npm run test:ui -- DetailsDrawer.test.jsx"
        ]
      }
    },
    related: {},
    warnings: [],
    actions: []
  };

  render(<DetailsDrawer details={details} onRunAction={onRunAction} />);

  expect(screen.getByText("产物")).toBeInTheDocument();
  expect(screen.getByText("src/app/components/DetailsDrawer.jsx")).toBeInTheDocument();
  expect(screen.getByText("UI artifact")).toBeInTheDocument();
  expect(screen.getByText("npm run test:ui -- DetailsDrawer.test.jsx")).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "用 系统默认 打开 src/app/components/DetailsDrawer.jsx" }));
  expect(onRunAction).toHaveBeenCalledWith("open_document", {
    sourcePath: "src/app/components/DetailsDrawer.jsx",
    editor: "default"
  });
});

test("DetailsDrawer keeps gate artifacts off the task detail", () => {
  const details = {
    node: {
      id: "task:demo",
      title: "Demo Task",
      type: "task",
      status: "ok",
      raw: {
        artifacts: [{ value: "runtime/tasks/demo.json" }],
        gates: [
          { id: "G1", name: "Intent", artifacts: [{ value: "handoff: scope" }] },
          { id: "G2", name: "Discovery", artifacts: [] }
        ]
      }
    },
    related: {},
    warnings: [],
    actions: []
  };

  render(<DetailsDrawer details={details} onRunAction={() => {}} />);

  expect(screen.getByText("任务级产物")).toBeInTheDocument();
  expect(screen.getByText("runtime/tasks/demo.json")).toBeInTheDocument();
  expect(screen.queryByText("步骤产物")).not.toBeInTheDocument();
  expect(screen.queryByText("handoff: scope")).not.toBeInTheDocument();
});
