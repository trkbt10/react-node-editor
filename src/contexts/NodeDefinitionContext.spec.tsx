import { render, screen } from "@testing-library/react";
import { type FC } from "react";
import { NodeDefinitionProvider, useNodeDefinition } from "./NodeDefinitionContext";

const Harness: FC = () => {
  const std = useNodeDefinition("standard");
  const grp = useNodeDefinition("group");
  return (
    <>
      <div data-testid="has-standard">{String(!!std)}</div>
      <div data-testid="has-group">{String(!!grp)}</div>
    </>
  );
};

describe("NodeDefinitionContext", () => {
  it("includes default definitions when includeDefaults=true", () => {
    render(
      <NodeDefinitionProvider includeDefaults>
        <Harness />
      </NodeDefinitionProvider>
    );
    expect(screen.getByTestId("has-standard").textContent).toBe("true");
    expect(screen.getByTestId("has-group").textContent).toBe("true");
  });
});
