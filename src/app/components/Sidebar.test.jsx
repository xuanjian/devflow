import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import Sidebar from "./Sidebar.jsx";

test("Sidebar renders navigation and filter controls", async () => {
  const onChange = vi.fn();
  render(<Sidebar activeView="overview" filters={{ query: "", typeFilter: "all", statusFilter: "all", showWarningsOnly: false }} onViewChange={onChange} onFiltersChange={onChange} />);

  expect(screen.getByText("上下文工作台")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "项目" })).toBeInTheDocument();
  await userEvent.type(screen.getByPlaceholderText("搜索节点、文件或说明"), "demo");
  expect(onChange).toHaveBeenCalled();
});
