import { render } from "@testing-library/react";
import { useEffect, useState, type FC } from "react";
import { KeyboardShortcutProvider, useKeyboardShortcut } from "./KeyboardShortcutContext";

const Harness: FC = () => {
  const { registerShortcut } = useKeyboardShortcut();
  const [hit, setHit] = useState(0);
  useEffect(() => {
    registerShortcut({ key: "k", ctrl: true }, () => setHit((v) => v + 1));
  }, [registerShortcut]);
  return <div data-testid="hit">{String(hit)}</div>;
};

describe("KeyboardShortcutContext", () => {
  it("invokes handler on matching keydown", () => {
    const { getByTestId } = render(
      <KeyboardShortcutProvider>
        <Harness />
      </KeyboardShortcutProvider>
    );
    const evt = new KeyboardEvent("keydown", { key: "k", ctrlKey: true });
    document.dispatchEvent(evt);
    expect(getByTestId("hit").textContent).toBe("1");
  });
});
