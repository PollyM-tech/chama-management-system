// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { Meetings } from "./meetings";
const { execute, data } = vi.hoisted(() => ({ execute: vi.fn().mockResolvedValue({ success: true }), data: { chama: { _id: "group" }, meetings: [], members: [], officer: true } }));
vi.mock("convex/react", () => ({ useMutation: () => execute }));
vi.mock("./workspace-shell", () => ({ useWorkspace: () => data }));
afterEach(() => { cleanup(); execute.mockClear(); data.officer = true; });

test("meeting scheduling submits East Africa Time consistently with an optional agenda", async () => {
  render(<Meetings />);
  fireEvent.change(screen.getByLabelText("Meeting title"), { target: { value: "Monthly review" } });
  fireEvent.change(screen.getByLabelText("Start (East Africa Time, UTC+3)"), { target: { value: "2027-01-15T18:30" } });
  fireEvent.change(screen.getByLabelText("Venue or online meeting link"), { target: { value: "Community hall" } });
  fireEvent.click(screen.getByRole("button", { name: "Schedule meeting" }));
  await waitFor(() => expect(execute).toHaveBeenCalledWith({ chamaId: "group", operation: "create_meeting", input: { title: "Monthly review", location: "Community hall", startsAt: Date.parse("2027-01-15T15:30:00Z") } }));
});

test("ordinary members cannot see meeting management forms", () => {
  data.officer = false;
  render(<Meetings />);
  expect(screen.queryByRole("button", { name: "Schedule meeting" })).toBeNull();
  expect(screen.getByText("No meetings scheduled yet.")).toBeTruthy();
});
