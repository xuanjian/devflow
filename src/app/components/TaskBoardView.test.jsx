import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import TaskBoardView from "./TaskBoardView.jsx";

test("TaskBoardView renders tasks and gate progress from graph nodes", async () => {
  const onSelectNode = vi.fn();
  const graph = {
    nodes: [
      { id: "task:demo", type: "task", title: "Demo Task", status: "ok", raw: { currentGate: "G4", status: "doing" } },
      { id: "gate:demo:G1", type: "gate", title: "G1 Intent", summary: "Intake", status: "ok", raw: { id: "G1", name: "Intent", status: "done" } },
      { id: "gate:demo:G4", type: "gate", title: "G4 Development", summary: "Development", status: "warning", raw: { id: "G4", name: "Development", status: "in_progress" } }
    ],
    edges: [
      { from: "task:demo", to: "gate:demo:G1", relation: "has-gate" },
      { from: "task:demo", to: "gate:demo:G4", relation: "has-gate" }
    ]
  };

  render(<TaskBoardView graph={graph} selectedNodeId="" onSelectNode={onSelectNode} />);

  expect(screen.getByText("Demo Task")).toBeInTheDocument();
  expect(screen.getByText("G4")).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: /G4 Development/ }));
  expect(onSelectNode).toHaveBeenCalledWith("gate:demo:G4");
});
