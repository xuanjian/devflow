import { render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import App from "./App.jsx";

afterEach(() => {
  vi.restoreAllMocks();
});

test("App renders loading state then main regions", async () => {
  global.fetch = vi.fn()
    .mockResolvedValueOnce({ ok: true, json: async () => ({ nodes: [], edges: [], groups: [], warnings: [] }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ checks: [] }) });

  render(<App />);

  expect(screen.getByText(/Context Studio/i)).toBeInTheDocument();
  expect(await screen.findByText(/Overview/i)).toBeInTheDocument();
});
