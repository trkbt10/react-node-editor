/**
 * @file Hierarchical node add menu with nested submenus
 *
 * Architecture:
 * - NodeAddMenu: Root component, manages state and provides context
 * - SubmenuPanel: Unified positioned container (position: fixed)
 * - CategoryItem: Recursive category renderer
 * - NodeItem: Leaf node renderer
 */
import * as React from "react";
import type { NodeDefinition } from "../../types/NodeDefinition";
import type { Position } from "../../types/core";
import { groupNodeDefinitionsNested } from "../../category/catalog";
import type { NestedNodeDefinitionCategory } from "../../category/types";
import { PlusIcon } from "../elements/icons";
import { CategoryIcon } from "../../category/components/CategoryIcon";
import { NodeCard } from "../node/cards/NodeCard";
import styles from "./NodeAddMenu.module.css";

const DEFAULT_CLOSE_DELAY_MS = 150;
const SUBMENU_OVERLAP = 8;

// ============================================================================
// Hooks
// ============================================================================

/**
 * Hook for scheduling a delayed callback with cancel capability.
 * Automatically cleans up on unmount.
 */
function useDelayedCallback(callback: () => void, delayMs: number) {
  const timeoutIdRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const stableCallback = React.useEffectEvent(callback);

  const cancel = React.useCallback(() => {
    if (timeoutIdRef.current !== null) {
      clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
    }
  }, []);

  const schedule = React.useCallback(() => {
    cancel();
    timeoutIdRef.current = setTimeout(() => {
      timeoutIdRef.current = null;
      stableCallback();
    }, delayMs);
  }, [cancel, delayMs]);

  React.useEffect(() => cancel, [cancel]);

  return { schedule, cancel };
}

// ============================================================================
// Context
// ============================================================================

/**
 * Context for centralized close timeout management.
 * All menu levels share this to coordinate hover behavior.
 */
type MenuHoverContextValue = {
  scheduleClose: () => void;
  cancelClose: () => void;
};

const MenuHoverContext = React.createContext<MenuHoverContextValue | null>(null);

function useMenuHoverContext(): MenuHoverContextValue {
  const ctx = React.useContext(MenuHoverContext);
  if (ctx === null) {
    throw new Error("useMenuHoverContext must be used within MenuHoverContext.Provider");
  }
  return ctx;
}

/**
 * Context for parent submenu container reference.
 * Used for horizontal alignment of nested submenus.
 */
const ParentSubmenuContext = React.createContext<React.RefObject<HTMLDivElement | null> | null>(null);

// ============================================================================
// Utility
// ============================================================================

function isPathOpen(openPath: string[], checkPath: string[]): boolean {
  if (openPath.length < checkPath.length) {
    return false;
  }
  return checkPath.every((segment, i) => openPath[i] === segment);
}

// ============================================================================
// Components
// ============================================================================

export type NodeAddMenuProps = {
  label: string;
  nodeDefinitions: NodeDefinition[];
  onSelectNode: (nodeType: string, position: Position) => void;
  canvasPosition: Position;
  disabledNodeTypes?: string[];
  onClose: () => void;
  /** Delay in ms before closing submenu on pointer leave (default: 150, use 0 for tests) */
  closeDelayMs?: number;
};

/**
 * Root component - manages state and context
 */
export const NodeAddMenu: React.FC<NodeAddMenuProps> = ({
  label,
  nodeDefinitions,
  onSelectNode,
  canvasPosition,
  disabledNodeTypes = [],
  onClose,
  closeDelayMs = DEFAULT_CLOSE_DELAY_MS,
}) => {
  const triggerRef = React.useRef<HTMLLIElement>(null);
  const [openPath, setOpenPath] = React.useState<string[]>([]);

  const { schedule: scheduleClose, cancel: cancelClose } = useDelayedCallback(
    () => setOpenPath([]),
    closeDelayMs,
  );

  const disabledSet = React.useMemo(
    () => new Set(disabledNodeTypes),
    [disabledNodeTypes],
  );

  const nestedCategories = React.useMemo(
    () => groupNodeDefinitionsNested(nodeDefinitions),
    [nodeDefinitions],
  );

  const handleSelectNode = React.useCallback(
    (nodeType: string) => {
      onSelectNode(nodeType, canvasPosition);
      onClose();
    },
    [onSelectNode, canvasPosition, onClose],
  );

  const rootPath = ["root"];
  const isOpen = isPathOpen(openPath, rootPath);

  const menuHoverContextValue = React.useMemo(
    () => ({ scheduleClose, cancelClose }),
    [scheduleClose, cancelClose],
  );

  const handlePointerEnter = React.useEffectEvent(() => {
    cancelClose();
    setOpenPath(rootPath);
  });

  const handlePointerLeave = React.useEffectEvent(() => {
    scheduleClose();
  });

  const handleClick = React.useEffectEvent(() => {
    if (isOpen) {
      setOpenPath([]);
    } else {
      setOpenPath(rootPath);
    }
  });

  return (
    <MenuHoverContext.Provider value={menuHoverContextValue}>
      <li
        ref={triggerRef}
        className={styles.menuItemWrapper}
        onPointerLeave={handlePointerLeave}
      >
        <div
          className={styles.menuItem}
          data-has-submenu="true"
          data-focused={isOpen ? "true" : undefined}
          onPointerEnter={handlePointerEnter}
          onClick={handleClick}
          role="menuitem"
          aria-haspopup="menu"
          aria-expanded={isOpen}
        >
          <span className={styles.menuItemIcon}>
            <PlusIcon size={14} />
          </span>
          <span className={styles.menuItemLabel}>{label}</span>
        </div>
        {isOpen && (
          <SubmenuPanel triggerRef={triggerRef}>
            <ul className={styles.submenuList}>
              {nestedCategories.map((category) => (
                <CategoryItem
                  key={category.path}
                  category={category}
                  openPath={openPath}
                  parentPath={rootPath}
                  onSetOpenPath={setOpenPath}
                  onSelectNode={handleSelectNode}
                  disabledSet={disabledSet}
                />
              ))}
            </ul>
          </SubmenuPanel>
        )}
      </li>
    </MenuHoverContext.Provider>
  );
};

NodeAddMenu.displayName = "NodeAddMenu";

/**
 * Unified positioned submenu container.
 * Handles position: fixed positioning with viewport boundary detection.
 */
type SubmenuPanelProps = {
  triggerRef: React.RefObject<HTMLElement | null>;
  children: React.ReactNode;
};

const SubmenuPanel: React.FC<SubmenuPanelProps> = React.memo(({ triggerRef, children }) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const parentContainerRef = React.useContext(ParentSubmenuContext);
  const [position, setPosition] = React.useState<{ left: number; top: number } | null>(null);
  const { scheduleClose, cancelClose } = useMenuHoverContext();

  React.useLayoutEffect(() => {
    const trigger = triggerRef.current;
    const container = containerRef.current;
    if (!trigger || !container) {
      return;
    }

    const triggerRect = trigger.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Use parent submenu for horizontal alignment if available, otherwise trigger
    const parentContainer = parentContainerRef?.current;
    const horizontalRect = parentContainer?.getBoundingClientRect() ?? triggerRect;

    // Position with overlap to show hierarchy
    let left = horizontalRect.right - SUBMENU_OVERLAP;
    let top = triggerRect.top;

    // Flip to left if would overflow right edge
    if (left + containerRect.width > viewportWidth - 8) {
      left = horizontalRect.left - containerRect.width + SUBMENU_OVERLAP;
    }

    // Clamp vertical position
    if (top + containerRect.height > viewportHeight - 8) {
      top = viewportHeight - containerRect.height - 8;
    }
    if (top < 8) {
      top = 8;
    }

    setPosition({ left, top });
  }, [triggerRef, parentContainerRef]);

  const handlePointerEnter = React.useEffectEvent(() => {
    cancelClose();
  });

  const handlePointerLeave = React.useEffectEvent(() => {
    scheduleClose();
  });

  const positionStyle: React.CSSProperties = position
    ? { left: position.left, top: position.top }
    : { visibility: "hidden" };

  return (
    <ParentSubmenuContext.Provider value={containerRef}>
      <div
        ref={containerRef}
        className={styles.submenu}
        style={positionStyle}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
      >
        {children}
      </div>
    </ParentSubmenuContext.Provider>
  );
});

SubmenuPanel.displayName = "SubmenuPanel";

/**
 * Recursive category item - renders itself and nested submenus.
 */
type CategoryItemProps = {
  category: NestedNodeDefinitionCategory;
  openPath: string[];
  parentPath: string[];
  onSetOpenPath: (path: string[]) => void;
  onSelectNode: (nodeType: string) => void;
  disabledSet: Set<string>;
};

const CategoryItem: React.FC<CategoryItemProps> = React.memo(({
  category,
  openPath,
  parentPath,
  onSetOpenPath,
  onSelectNode,
  disabledSet,
}) => {
  const itemRef = React.useRef<HTMLLIElement>(null);
  const { cancelClose } = useMenuHoverContext();
  const hasChildren = category.children.length > 0 || category.nodes.length > 0;
  const fullPath = React.useMemo(() => [...parentPath, category.path], [parentPath, category.path]);
  const isOpen = hasChildren && isPathOpen(openPath, fullPath);

  const handlePointerEnter = React.useEffectEvent(() => {
    cancelClose();
    if (hasChildren) {
      onSetOpenPath(fullPath);
    }
  });

  const handleClick = React.useEffectEvent(() => {
    if (!hasChildren) {
      return;
    }
    if (isOpen) {
      onSetOpenPath(parentPath);
    } else {
      onSetOpenPath(fullPath);
    }
  });

  // Memoize onSelect callbacks for child nodes
  const nodeSelectCallbacks = React.useMemo(() => {
    return category.nodes.reduce<Record<string, () => void>>((acc, node) => {
      acc[node.type] = () => onSelectNode(node.type);
      return acc;
    }, {});
  }, [category.nodes, onSelectNode]);

  if (!hasChildren) {
    return null;
  }

  return (
    <li ref={itemRef} className={styles.menuItemWrapper}>
      <div
        className={styles.menuItem}
        data-has-submenu="true"
        data-focused={isOpen ? "true" : undefined}
        onPointerEnter={handlePointerEnter}
        onClick={handleClick}
        tabIndex={0}
        role="menuitem"
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        {category.icon != null && <CategoryIcon icon={category.icon} />}
        <span className={styles.menuItemLabel}>{category.name}</span>
        <span className={styles.menuItemBadge}>{category.totalNodeCount}</span>
      </div>
      {isOpen && (
        <SubmenuPanel triggerRef={itemRef}>
          <ul className={styles.submenuList}>
            {category.children.map((child) => (
              <CategoryItem
                key={child.path}
                category={child}
                openPath={openPath}
                parentPath={fullPath}
                onSetOpenPath={onSetOpenPath}
                onSelectNode={onSelectNode}
                disabledSet={disabledSet}
              />
            ))}
            {category.nodes.map((node) => (
              <NodeItem
                key={node.type}
                node={node}
                disabled={disabledSet.has(node.type)}
                onSelect={nodeSelectCallbacks[node.type]}
              />
            ))}
          </ul>
        </SubmenuPanel>
      )}
    </li>
  );
});

CategoryItem.displayName = "CategoryItem";

/**
 * Leaf node item - clickable to create node.
 */
type NodeItemProps = {
  node: NodeDefinition;
  disabled: boolean;
  onSelect: () => void;
};

const NodeItem: React.FC<NodeItemProps> = React.memo(({ node, disabled, onSelect }) => {
  const { cancelClose } = useMenuHoverContext();

  const handlePointerEnter = React.useEffectEvent(() => {
    cancelClose();
  });

  const handleClick = React.useEffectEvent(() => {
    if (!disabled) {
      onSelect();
    }
  });

  return (
    <li className={styles.menuItemWrapper}>
      <NodeCard
        node={node}
        variant="menu"
        disabled={disabled}
        onPointerEnter={handlePointerEnter}
        onClick={handleClick}
        tabIndex={disabled ? -1 : 0}
        role="menuitem"
      />
    </li>
  );
});

NodeItem.displayName = "NodeItem";
