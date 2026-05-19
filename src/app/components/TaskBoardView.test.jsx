import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import TaskBoardView from "./TaskBoardView.jsx";

test("TaskBoardView renders tasks and gate progress from graph nodes", async () => {
  const onSelectNode = vi.fn();
  const graph = {
    nodes: [
      { id: "task:demo", type: "task", title: "Demo Task", summary: "Active work", status: "ok", raw: { currentGate: "G4", status: "doing", isActive: true } },
      { id: "task:other", type: "task", title: "Other Task", summary: "Older work", status: "ok", raw: { currentGate: "G2", status: "active" } },
      { id: "gate:demo:G1", type: "gate", title: "G1 Intent", summary: "Intake", status: "ok", raw: { id: "G1", name: "Intent", status: "done" } },
      { id: "gate:demo:G4", type: "gate", title: "G4 Development", summary: "Development", status: "warning", raw: { id: "G4", name: "Development", status: "in_progress" } },
      { id: "gate:other:G2", type: "gate", title: "G2 Discovery", summary: "Discovery", status: "warning", raw: { id: "G2", name: "Discovery", status: "in_progress" } }
    ],
    edges: [
      { from: "task:demo", to: "gate:demo:G1", relation: "has-gate" },
      { from: "task:demo", to: "gate:demo:G4", relation: "has-gate" },
      { from: "task:other", to: "gate:other:G2", relation: "has-gate" }
    ]
  };

  const view = render(<TaskBoardView graph={graph} selectedNodeId="" onSelectNode={onSelectNode} />);

  expect(screen.getAllByText("Demo Task").length).toBeGreaterThan(0);
  expect(screen.getByText("Other Task")).toBeInTheDocument();
  expect(screen.getByText("当前")).toBeInTheDocument();
  expect(screen.getByLabelText("当前流程")).toHaveTextContent("G4 Development");
  await userEvent.click(screen.getAllByRole("button", { name: /G4 Development/ }).find((item) => item.classList.contains("gate-card")));
  expect(onSelectNode).toHaveBeenCalledWith("gate:demo:G4");

  view.rerender(<TaskBoardView graph={graph} selectedNodeId="task:other" onSelectNode={onSelectNode} />);
  expect(screen.getByLabelText("当前流程")).toHaveTextContent("G2 Discovery");
  expect(screen.queryAllByRole("button", { name: /G4 Development/ }).find((item) => item.classList.contains("gate-card"))).toBeUndefined();
});

test("TaskBoardView keeps long gate summaries inside the card preview", () => {
  const graph = {
    nodes: [
      { id: "task:demo", type: "task", title: "Demo Task", summary: "Active work", status: "ok", raw: { currentGate: "G3", status: "doing", isActive: true } },
      {
        id: "gate:demo:G3",
        type: "gate",
        title: "G3 Plan",
        summary: "记录 superpowers 输出的产品、UI、技术方案或交互原型；L3/L4 或显式规格输入的任务在这里记录 OpenSpec proposal/design/tasks/spec-delta/very/long/unbroken/path，并把可执行边界交给 G4。",
        status: "ok",
        raw: { id: "G3", name: "Plan / Product UI", status: "done" }
      }
    ],
    edges: [
      { from: "task:demo", to: "gate:demo:G3", relation: "has-gate" }
    ]
  };

  const { container } = render(<TaskBoardView graph={graph} selectedNodeId="" onSelectNode={() => {}} />);
  const summary = container.querySelector(".gate-card p");

  expect(summary).toHaveClass("gate-summary");
});
