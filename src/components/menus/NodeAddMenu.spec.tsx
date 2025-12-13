/**
 * @file TDD tests for NodeAddMenu
 *
 * Comprehensive tests covering all menu hierarchy interaction patterns.
 * position: fixed submenus require coordinated timeout management.
 */
import * as React from "react";
import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import { NodeAddMenu } from "./NodeAddMenu";
import type { NodeDefinition } from "../../types/NodeDefinition";

// Helper to create test node definitions
function createNodeDefinitions(): NodeDefinition[] {
  return [
    {
      type: "node-a",
      displayName: "Node A",
      category: "Category1",
    },
    {
      type: "node-b",
      displayName: "Node B",
      category: "Category1",
    },
    {
      type: "node-c",
      displayName: "Node C",
      category: "Category2",
    },
    {
      type: "node-d",
      displayName: "Node D",
      category: "Category2/Subcategory",
    },
  ];
}

// Track function calls without vi.fn()
function createCallTracker<T extends unknown[]>() {
  const calls: T[] = [];
  const fn = (...args: T) => {
    calls.push(args);
  };
  return { fn, calls };
}

describe("NodeAddMenu", () => {
  const defaultProps = {
    label: "Add Node",
    nodeDefinitions: createNodeDefinitions(),
    canvasPosition: { x: 100, y: 100 },
    onClose: () => {},
    closeDelayMs: 0,
  };

  describe("initial render", () => {
    it("renders the menu item with label", () => {
      const tracker = createCallTracker<[string, { x: number; y: number }]>();
      render(
        <ul>
          <NodeAddMenu {...defaultProps} onSelectNode={tracker.fn} />
        </ul>
      );

      expect(screen.getByText("Add Node")).toBeInTheDocument();
    });

    it("does not show submenu initially", () => {
      const tracker = createCallTracker<[string, { x: number; y: number }]>();
      render(
        <ul>
          <NodeAddMenu {...defaultProps} onSelectNode={tracker.fn} />
        </ul>
      );

      expect(screen.queryByText("Category1")).not.toBeInTheDocument();
    });

    it("menu item does not have data-focused initially", () => {
      const tracker = createCallTracker<[string, { x: number; y: number }]>();
      render(
        <ul>
          <NodeAddMenu {...defaultProps} onSelectNode={tracker.fn} />
        </ul>
      );

      const menuItem = screen.getByRole("menuitem");
      expect(menuItem).not.toHaveAttribute("data-focused");
    });
  });

  describe("opening submenu", () => {
    it("shows categories on pointer enter", async () => {
      const tracker = createCallTracker<[string, { x: number; y: number }]>();
      render(
        <ul>
          <NodeAddMenu {...defaultProps} onSelectNode={tracker.fn} />
        </ul>
      );

      const menuItem = screen.getByText("Add Node").closest("[role='menuitem']")!;
      await act(async () => {
        fireEvent.pointerEnter(menuItem);
      });

      expect(screen.getByText("Category1")).toBeInTheDocument();
      expect(screen.getByText("Category2")).toBeInTheDocument();
    });

    it("shows categories on click", async () => {
      const tracker = createCallTracker<[string, { x: number; y: number }]>();
      render(
        <ul>
          <NodeAddMenu {...defaultProps} onSelectNode={tracker.fn} />
        </ul>
      );

      const menuItem = screen.getByText("Add Node").closest("[role='menuitem']")!;
      await act(async () => {
        fireEvent.click(menuItem);
      });

      expect(screen.getByText("Category1")).toBeInTheDocument();
    });

    it("sets data-focused when submenu is open", async () => {
      const tracker = createCallTracker<[string, { x: number; y: number }]>();
      render(
        <ul>
          <NodeAddMenu {...defaultProps} onSelectNode={tracker.fn} />
        </ul>
      );

      const menuItem = screen.getByText("Add Node").closest("[role='menuitem']")!;
      await act(async () => {
        fireEvent.pointerEnter(menuItem);
      });

      expect(menuItem).toHaveAttribute("data-focused", "true");
    });
  });

  describe("nested submenu navigation", () => {
    it("shows nodes when hovering on category", async () => {
      const tracker = createCallTracker<[string, { x: number; y: number }]>();
      render(
        <ul>
          <NodeAddMenu {...defaultProps} onSelectNode={tracker.fn} />
        </ul>
      );

      // Open root submenu
      const rootItem = screen.getByText("Add Node").closest("[role='menuitem']")!;
      await act(async () => {
        fireEvent.pointerEnter(rootItem);
      });

      // Hover on Category1
      const category1 = screen.getByText("Category1").closest("[role='menuitem']")!;
      await act(async () => {
        fireEvent.pointerEnter(category1);
      });

      // Should see nodes in Category1
      expect(screen.getByText("Node A")).toBeInTheDocument();
      expect(screen.getByText("Node B")).toBeInTheDocument();
    });

    it("sets data-focused on parent when nested submenu is open", async () => {
      const tracker = createCallTracker<[string, { x: number; y: number }]>();
      render(
        <ul>
          <NodeAddMenu {...defaultProps} onSelectNode={tracker.fn} />
        </ul>
      );

      // Open root submenu
      const rootItem = screen.getByText("Add Node").closest("[role='menuitem']")!;
      await act(async () => {
        fireEvent.pointerEnter(rootItem);
      });

      // Hover on Category1
      const category1 = screen.getByText("Category1").closest("[role='menuitem']")!;
      await act(async () => {
        fireEvent.pointerEnter(category1);
      });

      // Both root item and category should have data-focused
      expect(rootItem).toHaveAttribute("data-focused", "true");
      expect(category1).toHaveAttribute("data-focused", "true");
    });

    it("shows deeply nested categories", async () => {
      const tracker = createCallTracker<[string, { x: number; y: number }]>();
      render(
        <ul>
          <NodeAddMenu {...defaultProps} onSelectNode={tracker.fn} />
        </ul>
      );

      // Open root submenu
      const rootItem = screen.getByText("Add Node").closest("[role='menuitem']")!;
      await act(async () => {
        fireEvent.pointerEnter(rootItem);
      });

      // Hover on Category2
      const category2 = screen.getByText("Category2").closest("[role='menuitem']")!;
      await act(async () => {
        fireEvent.pointerEnter(category2);
      });

      // Should see Subcategory
      expect(screen.getByText("Subcategory")).toBeInTheDocument();
    });

    it("shows nodes in nested subcategory", async () => {
      const tracker = createCallTracker<[string, { x: number; y: number }]>();
      render(
        <ul>
          <NodeAddMenu {...defaultProps} onSelectNode={tracker.fn} />
        </ul>
      );

      // Open root submenu
      const rootItem = screen.getByText("Add Node").closest("[role='menuitem']")!;
      await act(async () => {
        fireEvent.pointerEnter(rootItem);
      });

      // Hover on Category2
      const category2 = screen.getByText("Category2").closest("[role='menuitem']")!;
      await act(async () => {
        fireEvent.pointerEnter(category2);
      });

      // Hover on Subcategory
      const subcategory = screen.getByText("Subcategory").closest("[role='menuitem']")!;
      await act(async () => {
        fireEvent.pointerEnter(subcategory);
      });

      // Should see Node D
      expect(screen.getByText("Node D")).toBeInTheDocument();
    });
  });

  describe("node selection", () => {
    it("calls onSelectNode when clicking a node", async () => {
      const tracker = createCallTracker<[string, { x: number; y: number }]>();
      const closeTracker = createCallTracker<[]>();
      render(
        <ul>
          <NodeAddMenu
            {...defaultProps}
            onSelectNode={tracker.fn}
            onClose={closeTracker.fn}
          />
        </ul>
      );

      // Open submenus
      const rootItem = screen.getByText("Add Node").closest("[role='menuitem']")!;
      await act(async () => {
        fireEvent.pointerEnter(rootItem);
      });

      const category1 = screen.getByText("Category1").closest("[role='menuitem']")!;
      await act(async () => {
        fireEvent.pointerEnter(category1);
      });

      // Click on Node A
      const nodeA = screen.getByText("Node A");
      await act(async () => {
        fireEvent.click(nodeA);
      });

      expect(tracker.calls).toHaveLength(1);
      expect(tracker.calls[0]).toEqual(["node-a", { x: 100, y: 100 }]);
    });

    it("calls onClose after selecting a node", async () => {
      const tracker = createCallTracker<[string, { x: number; y: number }]>();
      const closeTracker = createCallTracker<[]>();
      render(
        <ul>
          <NodeAddMenu
            {...defaultProps}
            onSelectNode={tracker.fn}
            onClose={closeTracker.fn}
          />
        </ul>
      );

      // Open submenus
      const rootItem = screen.getByText("Add Node").closest("[role='menuitem']")!;
      await act(async () => {
        fireEvent.pointerEnter(rootItem);
      });

      const category1 = screen.getByText("Category1").closest("[role='menuitem']")!;
      await act(async () => {
        fireEvent.pointerEnter(category1);
      });

      // Click on Node A
      const nodeA = screen.getByText("Node A");
      await act(async () => {
        fireEvent.click(nodeA);
      });

      expect(closeTracker.calls).toHaveLength(1);
    });
  });

  describe("disabled nodes", () => {
    it("does not call onSelectNode for disabled nodes", async () => {
      const tracker = createCallTracker<[string, { x: number; y: number }]>();
      render(
        <ul>
          <NodeAddMenu
            {...defaultProps}
            onSelectNode={tracker.fn}
            disabledNodeTypes={["node-a"]}
          />
        </ul>
      );

      // Open submenus
      const rootItem = screen.getByText("Add Node").closest("[role='menuitem']")!;
      await act(async () => {
        fireEvent.pointerEnter(rootItem);
      });

      const category1 = screen.getByText("Category1").closest("[role='menuitem']")!;
      await act(async () => {
        fireEvent.pointerEnter(category1);
      });

      // Click on disabled Node A
      const nodeA = screen.getByText("Node A");
      await act(async () => {
        fireEvent.click(nodeA);
      });

      expect(tracker.calls).toHaveLength(0);
    });

    it("marks disabled nodes with aria-disabled", async () => {
      const tracker = createCallTracker<[string, { x: number; y: number }]>();
      render(
        <ul>
          <NodeAddMenu
            {...defaultProps}
            onSelectNode={tracker.fn}
            disabledNodeTypes={["node-a"]}
          />
        </ul>
      );

      // Open submenus
      const rootItem = screen.getByText("Add Node").closest("[role='menuitem']")!;
      await act(async () => {
        fireEvent.pointerEnter(rootItem);
      });

      const category1 = screen.getByText("Category1").closest("[role='menuitem']")!;
      await act(async () => {
        fireEvent.pointerEnter(category1);
      });

      const nodeA = screen.getByText("Node A").closest("[role='menuitem']")!;
      expect(nodeA).toHaveAttribute("aria-disabled", "true");
    });
  });

  describe("menu hierarchy pointer interactions (position: fixed coordination)", () => {
    /**
     * These tests verify that the menu stays open when moving between
     * different parts of the menu hierarchy. Since submenus use position: fixed,
     * they are visually outside their parent elements, causing pointerLeave
     * to fire when moving from trigger to submenu.
     *
     * Note: Tests use closeDelayMs={0} from defaultProps for immediate execution.
     */

    describe("root trigger to submenu transition", () => {
      it("keeps submenu open when moving from root trigger to submenu", async () => {
        const tracker = createCallTracker<[string, { x: number; y: number }]>();
        render(
          <ul>
            <NodeAddMenu {...defaultProps} onSelectNode={tracker.fn} />
          </ul>
        );

        // Open submenu by hovering root
        const rootItem = screen.getByText("Add Node").closest("[role='menuitem']")!;
        const rootWrapper = rootItem.closest("li")!;
        await act(async () => {
          fireEvent.pointerEnter(rootItem);
        });

        await screen.findByText("Category1");
        expect(screen.getByText("Category1")).toBeInTheDocument();

        // Simulate moving to submenu: leave root wrapper, enter submenu
        const submenu = screen.getByText("Category1").closest("[class*='submenu']")!;
        await act(async () => {
          fireEvent.pointerEnter(submenu);
          fireEvent.pointerLeave(rootWrapper);
        });

        // Submenu should still be visible (closeDelayMs=0 means immediate)
        expect(screen.getByText("Category1")).toBeInTheDocument();
        expect(rootItem).toHaveAttribute("data-focused", "true");
      });

      it("keeps submenu open when hovering submenu items after leaving root", async () => {
        const tracker = createCallTracker<[string, { x: number; y: number }]>();
        render(
          <ul>
            <NodeAddMenu {...defaultProps} onSelectNode={tracker.fn} />
          </ul>
        );

        const rootItem = screen.getByText("Add Node").closest("[role='menuitem']")!;
        const rootWrapper = rootItem.closest("li")!;
        await act(async () => {
          fireEvent.pointerEnter(rootItem);
        });

        await screen.findByText("Category1");
        // Leave root and enter category item
        const category1 = screen.getByText("Category1").closest("[role='menuitem']")!;
        await act(async () => {
          fireEvent.pointerEnter(category1);
          fireEvent.pointerLeave(rootWrapper);
        });

        // Menu should stay open
        expect(screen.getByText("Category1")).toBeInTheDocument();
      });

      it("keeps submenu open when returning from submenu to root menu item", async () => {
        const tracker = createCallTracker<[string, { x: number; y: number }]>();
        render(
          <ul>
            <NodeAddMenu {...defaultProps} onSelectNode={tracker.fn} />
          </ul>
        );

        const rootItem = screen.getByText("Add Node").closest("[role='menuitem']")!;
        await act(async () => {
          fireEvent.pointerEnter(rootItem);
        });

        expect(screen.getByText("Category1")).toBeInTheDocument();

        // Move to submenu
        const submenu = screen.getByText("Category1").closest("[class*='submenu']")!;
        await act(async () => {
          fireEvent.pointerEnter(submenu);
        });

        // Now return back to root menu item
        await act(async () => {
          fireEvent.pointerLeave(submenu);
        });
        await act(async () => {
          fireEvent.pointerEnter(rootItem);
        });


        // Submenu should still be visible
        expect(screen.getByText("Category1")).toBeInTheDocument();
        expect(rootItem).toHaveAttribute("data-focused", "true");
      });

      it("keeps submenu open when returning from category item to root menu item", async () => {
        const tracker = createCallTracker<[string, { x: number; y: number }]>();
        render(
          <ul>
            <NodeAddMenu {...defaultProps} onSelectNode={tracker.fn} />
          </ul>
        );

        const rootItem = screen.getByText("Add Node").closest("[role='menuitem']")!;
        await act(async () => {
          fireEvent.pointerEnter(rootItem);
        });

        // Enter a category
        const category1 = screen.getByText("Category1").closest("[role='menuitem']")!;
        await act(async () => {
          fireEvent.pointerEnter(category1);
        });

        expect(screen.getByText("Node A")).toBeInTheDocument();

        // Return to root menu item
        const category1Wrapper = category1.closest("li")!;
        await act(async () => {
          fireEvent.pointerLeave(category1Wrapper);
        });
        await act(async () => {
          fireEvent.pointerEnter(rootItem);
        });


        // Root submenu should still be visible (Category1's nested submenu closes due to path change)
        expect(screen.getByText("Category1")).toBeInTheDocument();
        expect(screen.getByText("Category2")).toBeInTheDocument();
      });
    });

    describe("submenu to nested submenu transition", () => {
      it("keeps all menus open when moving from category to nested submenu", async () => {
        const tracker = createCallTracker<[string, { x: number; y: number }]>();
        render(
          <ul>
            <NodeAddMenu {...defaultProps} onSelectNode={tracker.fn} />
          </ul>
        );

        // Open full path: root -> Category2 -> Subcategory
        const rootItem = screen.getByText("Add Node").closest("[role='menuitem']")!;
        await act(async () => {
          fireEvent.pointerEnter(rootItem);
        });

        const category2 = screen.getByText("Category2").closest("[role='menuitem']")!;
        const category2Wrapper = category2.closest("li")!;
        await act(async () => {
          fireEvent.pointerEnter(category2);
        });

        expect(screen.getByText("Subcategory")).toBeInTheDocument();

        // Leave category wrapper, enter nested submenu
        const nestedSubmenu = screen.getByText("Subcategory").closest("[class*='submenu']")!;
        await act(async () => {
          fireEvent.pointerLeave(category2Wrapper);
        });
        await act(async () => {
          fireEvent.pointerEnter(nestedSubmenu);
        });


        // All should remain open
        expect(screen.getByText("Category2")).toBeInTheDocument();
        expect(screen.getByText("Subcategory")).toBeInTheDocument();
      });
    });

    describe("nested submenu back to parent transition", () => {
      it("keeps parent submenu open when moving from nested back to parent", async () => {
        const tracker = createCallTracker<[string, { x: number; y: number }]>();
        render(
          <ul>
            <NodeAddMenu {...defaultProps} onSelectNode={tracker.fn} />
          </ul>
        );

        // Open full path
        const rootItem = screen.getByText("Add Node").closest("[role='menuitem']")!;
        await act(async () => {
          fireEvent.pointerEnter(rootItem);
        });

        const category2 = screen.getByText("Category2").closest("[role='menuitem']")!;
        await act(async () => {
          fireEvent.pointerEnter(category2);
        });

        const subcategory = screen.getByText("Subcategory").closest("[role='menuitem']")!;
        await act(async () => {
          fireEvent.pointerEnter(subcategory);
        });

        expect(screen.getByText("Node D")).toBeInTheDocument();

        // Move from subcategory back to category2
        const subcategoryWrapper = subcategory.closest("li")!;
        await act(async () => {
          fireEvent.pointerLeave(subcategoryWrapper);
        });
        await act(async () => {
          fireEvent.pointerEnter(category2);
        });


        // Parent submenu should stay open (nested may close based on path change)
        expect(screen.getByText("Category2")).toBeInTheDocument();
      });

      it("keeps root submenu open when moving from nested all the way back to root", async () => {
        const tracker = createCallTracker<[string, { x: number; y: number }]>();
        render(
          <ul>
            <NodeAddMenu {...defaultProps} onSelectNode={tracker.fn} />
          </ul>
        );

        // Open full path
        const rootItem = screen.getByText("Add Node").closest("[role='menuitem']")!;
        await act(async () => {
          fireEvent.pointerEnter(rootItem);
        });

        const category2 = screen.getByText("Category2").closest("[role='menuitem']")!;
        await act(async () => {
          fireEvent.pointerEnter(category2);
        });

        const subcategory = screen.getByText("Subcategory").closest("[role='menuitem']")!;
        await act(async () => {
          fireEvent.pointerEnter(subcategory);
        });

        // Move directly from nested submenu back to root
        const nestedSubmenu = screen.getByText("Node D").closest("[class*='submenu']")!;
        await act(async () => {
          fireEvent.pointerLeave(nestedSubmenu);
        });
        await act(async () => {
          fireEvent.pointerEnter(rootItem);
        });


        // Root submenu should stay visible
        expect(screen.getByText("Category1")).toBeInTheDocument();
        expect(screen.getByText("Category2")).toBeInTheDocument();
      });

      it("keeps menus open when returning from nested submenu container to category item", async () => {
        const tracker = createCallTracker<[string, { x: number; y: number }]>();
        render(
          <ul>
            <NodeAddMenu {...defaultProps} onSelectNode={tracker.fn} />
          </ul>
        );

        // Open path to nested submenu
        const rootItem = screen.getByText("Add Node").closest("[role='menuitem']")!;
        await act(async () => {
          fireEvent.pointerEnter(rootItem);
        });

        const category2 = screen.getByText("Category2").closest("[role='menuitem']")!;
        await act(async () => {
          fireEvent.pointerEnter(category2);
        });

        // Enter the nested submenu container
        const nestedSubmenu = screen.getByText("Subcategory").closest("[class*='submenu']")!;
        await act(async () => {
          fireEvent.pointerEnter(nestedSubmenu);
        });

        // Return to the category item that triggered this submenu
        await act(async () => {
          fireEvent.pointerLeave(nestedSubmenu);
        });
        await act(async () => {
          fireEvent.pointerEnter(category2);
        });


        // Everything should stay open
        expect(screen.getByText("Category2")).toBeInTheDocument();
        expect(screen.getByText("Subcategory")).toBeInTheDocument();
      });

      it("keeps menus open when returning from deep node back to parent category item", async () => {
        const tracker = createCallTracker<[string, { x: number; y: number }]>();
        render(
          <ul>
            <NodeAddMenu {...defaultProps} onSelectNode={tracker.fn} />
          </ul>
        );

        // Open full path to see Node D
        const rootItem = screen.getByText("Add Node").closest("[role='menuitem']")!;
        await act(async () => {
          fireEvent.pointerEnter(rootItem);
        });

        const category2 = screen.getByText("Category2").closest("[role='menuitem']")!;
        await act(async () => {
          fireEvent.pointerEnter(category2);
        });

        const subcategory = screen.getByText("Subcategory").closest("[role='menuitem']")!;
        await act(async () => {
          fireEvent.pointerEnter(subcategory);
        });

        // Hover on Node D, then return to Subcategory item
        const nodeD = screen.getByText("Node D").closest("[role='menuitem']")!;
        await act(async () => {
          fireEvent.pointerEnter(nodeD);
        });

        // Return to subcategory item
        await act(async () => {
          fireEvent.pointerEnter(subcategory);
        });


        // All levels should remain open
        expect(screen.getByText("Category2")).toBeInTheDocument();
        expect(screen.getByText("Subcategory")).toBeInTheDocument();
        expect(screen.getByText("Node D")).toBeInTheDocument();
      });

      it("keeps menus open when returning from first-level submenu container to root item", async () => {
        const tracker = createCallTracker<[string, { x: number; y: number }]>();
        render(
          <ul>
            <NodeAddMenu {...defaultProps} onSelectNode={tracker.fn} />
          </ul>
        );

        const rootItem = screen.getByText("Add Node").closest("[role='menuitem']")!;
        await act(async () => {
          fireEvent.pointerEnter(rootItem);
        });

        // Enter the first-level submenu container (not a specific item)
        const submenu = screen.getByText("Category1").closest("[class*='submenu']")!;
        await act(async () => {
          fireEvent.pointerEnter(submenu);
        });

        // Return to root item
        await act(async () => {
          fireEvent.pointerLeave(submenu);
        });
        await act(async () => {
          fireEvent.pointerEnter(rootItem);
        });


        // Submenu should stay open
        expect(screen.getByText("Category1")).toBeInTheDocument();
        expect(screen.getByText("Category2")).toBeInTheDocument();
      });
    });

    describe("sibling category switching", () => {
      it("switches to new category when moving between siblings", async () => {
        const tracker = createCallTracker<[string, { x: number; y: number }]>();
        render(
          <ul>
            <NodeAddMenu {...defaultProps} onSelectNode={tracker.fn} />
          </ul>
        );

        // Open Category1 path
        const rootItem = screen.getByText("Add Node").closest("[role='menuitem']")!;
        await act(async () => {
          fireEvent.pointerEnter(rootItem);
        });

        const category1 = screen.getByText("Category1").closest("[role='menuitem']")!;
        await act(async () => {
          fireEvent.pointerEnter(category1);
        });

        expect(screen.getByText("Node A")).toBeInTheDocument();

        // Switch to Category2
        const category2 = screen.getByText("Category2").closest("[role='menuitem']")!;
        await act(async () => {
          fireEvent.pointerEnter(category2);
        });

        // Category2's submenu should be open now
        expect(screen.getByText("Subcategory")).toBeInTheDocument();
        // Category1's nodes should be gone
        expect(screen.queryByText("Node A")).not.toBeInTheDocument();
      });
    });

    describe("leaving entire menu tree", () => {
      it("closes all menus when leaving entire tree", async () => {
        const tracker = createCallTracker<[string, { x: number; y: number }]>();
        render(
          <ul>
            <NodeAddMenu {...defaultProps} onSelectNode={tracker.fn} />
          </ul>
        );

        // Open full path
        const rootItem = screen.getByText("Add Node").closest("[role='menuitem']")!;
        await act(async () => {
          fireEvent.pointerEnter(rootItem);
        });

        const category2 = screen.getByText("Category2").closest("[role='menuitem']")!;
        await act(async () => {
          fireEvent.pointerEnter(category2);
        });

        const subcategory = screen.getByText("Subcategory").closest("[role='menuitem']")!;
        await act(async () => {
          fireEvent.pointerEnter(subcategory);
        });

        expect(screen.getByText("Node D")).toBeInTheDocument();

        // Leave the deepest submenu without entering anything else
        const deepSubmenu = screen.getByText("Node D").closest("[class*='submenu']")!;
        await act(async () => {
          fireEvent.pointerLeave(deepSubmenu);
        });

        // With closeDelayMs=0, menus close after timeout resolves
        await waitFor(() => {
          expect(screen.queryByText("Category1")).not.toBeInTheDocument();
        });
        expect(screen.queryByText("Subcategory")).not.toBeInTheDocument();
        expect(screen.queryByText("Node D")).not.toBeInTheDocument();
      });

      it("removes data-focused when leaving entire tree", async () => {
        const tracker = createCallTracker<[string, { x: number; y: number }]>();
        render(
          <ul>
            <NodeAddMenu {...defaultProps} onSelectNode={tracker.fn} />
          </ul>
        );

        const rootItem = screen.getByText("Add Node").closest("[role='menuitem']")!;
        await act(async () => {
          fireEvent.pointerEnter(rootItem);
        });

        expect(rootItem).toHaveAttribute("data-focused", "true");

        const rootWrapper = rootItem.closest("li")!;
        await act(async () => {
          fireEvent.pointerLeave(rootWrapper);
        });

        // With closeDelayMs=0, data-focused is removed after timeout resolves
        await waitFor(() => {
          expect(rootItem).not.toHaveAttribute("data-focused");
        });
      });

    });

    describe("edge cases", () => {
      it("handles rapid enter/leave/enter sequences", async () => {
        const tracker = createCallTracker<[string, { x: number; y: number }]>();
        render(
          <ul>
            <NodeAddMenu {...defaultProps} onSelectNode={tracker.fn} />
          </ul>
        );

        const rootItem = screen.getByText("Add Node").closest("[role='menuitem']")!;
        const rootWrapper = rootItem.closest("li")!;

        // Rapid sequence
        await act(async () => {
          fireEvent.pointerEnter(rootItem);
        });
        await act(async () => {
          fireEvent.pointerLeave(rootWrapper);
        });
        await act(async () => {
          fireEvent.pointerEnter(rootItem);
        });
        await act(async () => {
          fireEvent.pointerLeave(rootWrapper);
        });
        await act(async () => {
          fireEvent.pointerEnter(rootItem);
        });


        // Should be open (last action was enter)
        expect(screen.getByText("Category1")).toBeInTheDocument();
      });

      it("handles moving through multiple submenus without settling", async () => {
        const tracker = createCallTracker<[string, { x: number; y: number }]>();
        render(
          <ul>
            <NodeAddMenu {...defaultProps} onSelectNode={tracker.fn} />
          </ul>
        );

        // Open root
        const rootItem = screen.getByText("Add Node").closest("[role='menuitem']")!;
        await act(async () => {
          fireEvent.pointerEnter(rootItem);
        });

        // Quickly hover Category1 then Category2
        const category1 = screen.getByText("Category1").closest("[role='menuitem']")!;
        await act(async () => {
          fireEvent.pointerEnter(category1);
        });


        const category2 = screen.getByText("Category2").closest("[role='menuitem']")!;
        await act(async () => {
          fireEvent.pointerEnter(category2);
        });


        // Should show Category2's submenu, not Category1's
        expect(screen.getByText("Subcategory")).toBeInTheDocument();
        expect(screen.queryByText("Node A")).not.toBeInTheDocument();
      });
    });
  });

  describe("badge display", () => {
    it("shows node count badge on categories", async () => {
      const tracker = createCallTracker<[string, { x: number; y: number }]>();
      render(
        <ul>
          <NodeAddMenu {...defaultProps} onSelectNode={tracker.fn} />
        </ul>
      );

      // Open root submenu
      const rootItem = screen.getByText("Add Node").closest("[role='menuitem']")!;
      await act(async () => {
        fireEvent.pointerEnter(rootItem);
      });

      // Both categories have 2 nodes each
      const badges = screen.getAllByText("2");
      expect(badges.length).toBe(2);
    });
  });
});
