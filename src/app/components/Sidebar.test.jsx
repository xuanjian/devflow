import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import Sidebar from "./Sidebar.jsx";

test("Sidebar renders navigation and filter controls", async () => {
  const onChange = vi.fn();
  render(<Sidebar activeView="overview" filters={{ query: "", typeFilter: "all", statusFilter: "all", showWarningsOnly: false }} onViewChange={onChange} onFiltersChange={onChange} />);

  expect(screen.getByText("Context Studio")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Projects" })).toBeInTheDocument();
  await userEvent.type(screen.getByPlaceholderText(/Search/i), "demo");
  expect(onChange).toHaveBeenCalled();
});
