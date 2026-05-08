import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import GraphView from "./GraphView.jsx";

test("GraphView renders nodes and calls onSelectNode", async () => {
  const onSelectNode = vi.fn();
  const graph = {
    nodes: [
      { id: "root:ai-context", type: "root", title: "ai-context", status: "ok" },
      { id: "group:projects", type: "group", title: "Projects", status: "ok" },
      { id: "project:demo", type: "project", title: "Demo", status: "warning" }
    ],
    edges: [{ from: "root:ai-context", to: "group:projects", relation: "contains" }]
  };

  render(<GraphView graph={graph} selectedNodeId="" onSelectNode={onSelectNode} />);
  await userEvent.click(screen.getByRole("button", { name: /Demo/ }));
  expect(onSelectNode).toHaveBeenCalledWith("project:demo");
});

test("GraphView hides cross links until a related node is selected", () => {
  const graph = {
    nodes: [
      { id: "root:ai-context", type: "root", title: "ai-context", status: "ok" },
      { id: "group:projects", type: "group", title: "Projects", status: "ok" },
      { id: "project:demo", type: "project", title: "Demo", status: "ok" },
      { id: "scene:demo", type: "scene", title: "Scene", status: "ok" }
    ],
    edges: [
      { from: "root:ai-context", to: "group:projects", relation: "contains" },
      { from: "group:projects", to: "project:demo", relation: "contains" },
      { from: "project:demo", to: "scene:demo", relation: "uses-scene" }
    ]
  };

  const { rerender } = render(<GraphView graph={graph} selectedNodeId="" onSelectNode={() => {}} />);
  expect(screen.queryByTestId("edge-project:demo-scene:demo-uses-scene")).not.toBeInTheDocument();

  rerender(<GraphView graph={graph} selectedNodeId="project:demo" onSelectNode={() => {}} />);
  expect(screen.getByTestId("edge-project:demo-scene:demo-uses-scene")).toBeInTheDocument();
});

test("GraphView expands the canvas height to include long node columns", () => {
  const projectNodes = Array.from({ length: 18 }, (_, index) => ({
    id: `project:demo-${index}`,
    type: "project",
    title: `Project ${index}`,
    status: "ok"
  }));
  const graph = {
    nodes: [
      { id: "root:ai-context", type: "root", title: "ai-context", status: "ok" },
      { id: "group:projects", type: "group", title: "Projects", status: "ok" },
      ...projectNodes
    ],
    edges: []
  };

  render(<GraphView graph={graph} selectedNodeId="" onSelectNode={() => {}} />);

  const svg = screen.getByRole("img", { name: /relationship map/i });
  const [, , , height] = svg.getAttribute("viewBox").split(" ").map(Number);
  expect(height).toBeGreaterThan(900);
});
