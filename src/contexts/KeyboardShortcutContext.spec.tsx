/**
 * @file Tests for keyboard shortcut registration and event handling
 */
import { render, act } from "@testing-library/react";
import { useEffect, useState, type FC } from "react";
import { KeyboardShortcutProvider, useKeyboardShortcut, useRegisterShortcut } from "./KeyboardShortcutContext";

const Harness: FC = () => {
  const { registerShortcut } = useKeyboardShortcut();
  const [hit, setHit] = useState(0);
  useEffect(() => {
    registerShortcut({ key: "k", ctrl: true }, () => setHit((v) => v + 1));
  }, [registerShortcut]);
  return <div data-testid="hit">{String(hit)}</div>;
};

const CmdOrCtrlHarness: FC = () => {
  const [hit, setHit] = useState(0);
  useRegisterShortcut({ key: "c", cmdOrCtrl: true }, () => setHit((v) => v + 1), []);
  return <div data-testid="hit">{String(hit)}</div>;
};

describe("KeyboardShortcutContext", () => {
  it("invokes handler on matching keydown", () => {
    const { getByTestId } = render(
      <KeyboardShortcutProvider>
        <Harness />
      </KeyboardShortcutProvider>,
    );
    act(() => {
      const evt = new KeyboardEvent("keydown", { key: "k", ctrlKey: true });
      document.dispatchEvent(evt);
    });
    expect(getByTestId("hit").textContent).toBe("1");
  });

  it("cmdOrCtrl registers both Ctrl and Meta shortcuts", () => {
    const { getByTestId } = render(
      <KeyboardShortcutProvider>
        <CmdOrCtrlHarness />
      </KeyboardShortcutProvider>,
    );

    // Test Ctrl variant
    act(() => {
      const ctrlEvt = new KeyboardEvent("keydown", { key: "c", ctrlKey: true });
      document.dispatchEvent(ctrlEvt);
    });
    expect(getByTestId("hit").textContent).toBe("1");

    // Test Meta variant
    act(() => {
      const metaEvt = new KeyboardEvent("keydown", { key: "c", metaKey: true });
      document.dispatchEvent(metaEvt);
    });
    expect(getByTestId("hit").textContent).toBe("2");
  });

  it("cmdOrCtrl works with shift modifier", () => {
    const ShiftHarness: FC = () => {
      const [hit, setHit] = useState(0);
      useRegisterShortcut({ key: "z", cmdOrCtrl: true, shift: true }, () => setHit((v) => v + 1), []);
      return <div data-testid="hit">{String(hit)}</div>;
    };

    const { getByTestId } = render(
      <KeyboardShortcutProvider>
        <ShiftHarness />
      </KeyboardShortcutProvider>,
    );

    // Test Ctrl+Shift variant
    act(() => {
      const ctrlShiftEvt = new KeyboardEvent("keydown", {
        key: "z",
        ctrlKey: true,
        shiftKey: true,
      });
      document.dispatchEvent(ctrlShiftEvt);
    });
    expect(getByTestId("hit").textContent).toBe("1");

    // Test Meta+Shift variant
    act(() => {
      const metaShiftEvt = new KeyboardEvent("keydown", {
        key: "z",
        metaKey: true,
        shiftKey: true,
      });
      document.dispatchEvent(metaShiftEvt);
    });
    expect(getByTestId("hit").textContent).toBe("2");
  });
});
