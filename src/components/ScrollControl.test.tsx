import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, act, cleanup } from "@testing-library/react";
import ScrollControl from "./ScrollControl";

const setScrollY = (y: number) => {
  Object.defineProperty(window, "scrollY", { value: y, configurable: true });
  act(() => { window.dispatchEvent(new Event("scroll")); });
};

describe("ScrollControl", () => {
  afterEach(() => { cleanup(); setScrollY(0); });

  it("is hidden until the page is scrolled past 300px", () => {
    render(<ScrollControl />);
    expect(screen.queryByLabelText("Scroll to top")).toBeNull();
    setScrollY(301);
    expect(screen.getByLabelText("Scroll to top")).toBeTruthy();
    expect(screen.getByLabelText("Scroll to footer")).toBeTruthy();
  });

  it("scrolls to top and to the footer", () => {
    const scrollTo = vi.fn();
    window.scrollTo = scrollTo as unknown as typeof window.scrollTo;
    const footer = document.createElement("footer");
    footer.scrollIntoView = vi.fn();
    document.body.appendChild(footer);
    render(<ScrollControl />);
    setScrollY(500);
    fireEvent.click(screen.getByLabelText("Scroll to top"));
    expect(scrollTo).toHaveBeenCalledWith(expect.objectContaining({ top: 0 }));
    fireEvent.click(screen.getByLabelText("Scroll to footer"));
    expect(footer.scrollIntoView).toHaveBeenCalled();
    footer.remove();
  });
});
