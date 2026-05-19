import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import GraphView from "./GraphView.jsx";

test("GraphView renders nodes and calls onSelectNode", async () => {
  const onSelectNode = vi.fn();
  const graph = {
    nodes: [
      { id: "root:context-index", type: "root", title: "上下文索引", status: "ok" },
      { id: "group:projects", type: "group", title: "Projects", status: "ok" },
      { id: "project:demo", type: "project", title: "Demo", status: "warning" }
    ],
    edges: [{ from: "root:context-index", to: "group:projects", relation: "contains" }]
  };

  render(<GraphView graph={graph} selectedNodeId="" onSelectNode={onSelectNode} />);
  expect(screen.getByText("全局关系")).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "Demo 项目" }));
  expect(onSelectNode).toHaveBeenCalledWith("project:demo");
});

test("GraphView shows graph links globally and emphasizes focused relations", () => {
  const graph = {
    nodes: [
      { id: "root:context-index", type: "root", title: "上下文索引", status: "ok" },
      { id: "group:projects", type: "group", title: "Projects", status: "ok" },
      { id: "project:demo", type: "project", title: "Demo", status: "ok" },
      { id: "scene:demo", type: "scene", title: "Scene", status: "ok" },
      { id: "gate:demo:G4", type: "gate", title: "G4 Development", status: "ok" }
    ],
    edges: [
      { from: "root:context-index", to: "group:projects", relation: "contains" },
      { from: "group:projects", to: "project:demo", relation: "contains" },
      { from: "project:demo", to: "scene:demo", relation: "uses-scene" },
      { from: "project:demo", to: "gate:demo:G4", relation: "touches-gate" }
    ]
  };

  const { rerender } = render(<GraphView graph={graph} selectedNodeId="" onSelectNode={() => {}} />);
  expect(screen.getByTestId("edge-project:demo-scene:demo-uses-scene")).toBeInTheDocument();
  expect(screen.queryByTestId("edge-root:context-index-group:projects-contains")).not.toBeInTheDocument();
  expect(screen.queryByTestId("edge-group:projects-project:demo-contains")).not.toBeInTheDocument();

  rerender(<GraphView graph={graph} selectedNodeId="project:demo" onSelectNode={() => {}} />);
  expect(screen.getByText("聚焦关系")).toBeInTheDocument();
  expect(screen.getByTestId("edge-project:demo-scene:demo-uses-scene")).toHaveClass("focused-edge");
  expect(screen.queryByTestId("edge-group:projects-project:demo-contains")).not.toBeInTheDocument();
  expect(screen.getByText("G4 Development")).toBeInTheDocument();
});

test("GraphView filters the graph to a selected project from the project rail", async () => {
  const user = userEvent.setup();
  const onSelectNode = vi.fn();
  const graph = {
    nodes: [
      { id: "project:alpha", type: "project", title: "Alpha", status: "ok" },
      { id: "project:beta", type: "project", title: "Beta", status: "ok" },
      { id: "skill:alpha", type: "skill", title: "Alpha Skill", status: "ok" },
      { id: "skill:beta", type: "skill", title: "Beta Skill", status: "ok" }
    ],
    edges: [
      { from: "project:alpha", to: "skill:alpha", relation: "uses-skill" },
      { from: "project:beta", to: "skill:beta", relation: "uses-skill" }
    ]
  };

  render(<GraphView graph={graph} selectedNodeId="" onSelectNode={onSelectNode} />);

  expect(screen.getByRole("button", { name: "Alpha 项目" })).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "筛选项目 Alpha" }));

  expect(onSelectNode).toHaveBeenCalledWith("project:alpha");
  expect(screen.getByRole("button", { name: "Alpha 项目" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Alpha Skill 技能" })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Beta 项目" })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Beta Skill 技能" })).not.toBeInTheDocument();
  expect(screen.getByTestId("edge-project:alpha-skill:alpha-uses-skill")).toBeInTheDocument();
  expect(screen.queryByTestId("edge-project:beta-skill:beta-uses-skill")).not.toBeInTheDocument();
});

test("GraphView lets nodes be dragged and keeps edges attached", () => {
  const graph = {
    nodes: [
      { id: "project:alpha", type: "project", title: "Alpha", status: "ok" },
      { id: "skill:alpha", type: "skill", title: "Alpha Skill", status: "ok" }
    ],
    edges: [
      { from: "project:alpha", to: "skill:alpha", relation: "uses-skill" }
    ]
  };

  render(<GraphView graph={graph} selectedNodeId="" onSelectNode={() => {}} />);

  const svg = screen.getByRole("img", { name: /上下文关系图/i });
  svg.getBoundingClientRect = () => ({ left: 0, top: 0, width: 1280, height: 980 });

  const alphaNode = screen.getByTestId("graph-node-project:alpha");
  const edge = screen.getByTestId("edge-project:alpha-skill:alpha-uses-skill");
  fireEvent.mouseDown(alphaNode, { button: 0, clientX: 560, clientY: 235 });
  fireEvent.mouseMove(svg.parentElement, { clientX: 660, clientY: 275 });
  fireEvent.mouseUp(svg.parentElement);

  expect(edge).toHaveAttribute("x1", "660");
  expect(edge).toHaveAttribute("y1", "338");
});

test("GraphView renders compact point nodes instead of card labels", () => {
  const graph = {
    nodes: [
      { id: "project:demo", type: "project", title: "Demo", status: "ok" }
    ],
    edges: []
  };

  const { container } = render(<GraphView graph={graph} selectedNodeId="" onSelectNode={() => {}} />);

  expect(container.querySelector(".node-dot")).toBeInTheDocument();
  expect(screen.queryByText("项目")).not.toBeInTheDocument();
});

test("GraphView does not expose config maintenance actions", () => {
  const onRunAction = vi.fn();
  const graph = {
    nodes: [
      { id: "group:projects", type: "group", title: "项目", status: "ok" },
      { id: "group:scenes", type: "group", title: "场景", status: "ok" },
      { id: "group:skills", type: "group", title: "技能", status: "ok" },
      { id: "group:rules", type: "group", title: "规则", status: "ok" }
    ],
    edges: []
  };

  render(<GraphView graph={graph} selectedNodeId="" onRunAction={onRunAction} onSelectNode={() => {}} />);

  expect(screen.queryByRole("button", { name: /新增项目/ })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /新增场景/ })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /新增技能/ })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /新增规则/ })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "生成并关联" })).not.toBeInTheDocument();
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
      { id: "root:context-index", type: "root", title: "上下文索引", status: "ok" },
      { id: "group:projects", type: "group", title: "Projects", status: "ok" },
      ...projectNodes
    ],
    edges: []
  };

  render(<GraphView graph={graph} selectedNodeId="" onSelectNode={() => {}} />);

  const svg = screen.getByRole("img", { name: /上下文关系图/i });
  const [, , , height] = svg.getAttribute("viewBox").split(" ").map(Number);
  expect(height).toBeGreaterThan(900);
});
