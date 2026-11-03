// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { DemoDashboard } from "./demo-dashboard";

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("landing-page demo", () => {
  test("updates the balance, contributions, and members after 30 seconds", () => {
    render(<DemoDashboard />);
    expect(screen.getByText("KES 428,500")).toBeTruthy();
    act(() => vi.advanceTimersByTime(29_999));
    expect(screen.getByText("KES 428,500")).toBeTruthy();
    act(() => vi.advanceTimersByTime(1));
    expect(screen.getByText("KES 439,000")).toBeTruthy();
    expect(screen.getByText("KES 96,500")).toBeTruthy();
    expect(screen.getByText("33 Members")).toBeTruthy();
    expect(screen.getByText("30 contributions received")).toBeTruthy();
  });

  test("cycles automatically and cleans up its timer on unmount", () => {
    const { unmount } = render(<DemoDashboard />);
    expect(screen.queryByText("Interactive demo")).toBeNull();
    expect(screen.queryByRole("combobox")).toBeNull();
    act(() => vi.advanceTimersByTime(30_000));
    expect(screen.getByText("KES 439,000")).toBeTruthy();
    act(() => vi.advanceTimersByTime(90_000));
    expect(screen.getByText("KES 428,500")).toBeTruthy();
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  test("sidebar navigation shows demo details while the samples keep updating", () => {
    render(<DemoDashboard />);
    fireEvent.click(screen.getByRole("button", { name: "Members" }));
    expect(
      screen.getByRole("heading", { name: "32 people. One shared goal." }),
    ).toBeTruthy();
    act(() => vi.advanceTimersByTime(30_000));
    expect(
      screen.getByRole("heading", { name: "33 people. One shared goal." }),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Back to dashboard" }));
    expect(
      screen.getByRole("heading", { name: "Recent contributions" }),
    ).toBeTruthy();
  });
});
