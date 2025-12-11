/**
 * @file Example selector component with split pane view and nested categories
 */
import * as React from "react";
import { Input } from "../../components/elements/Input";
import styles from "./ExampleSelector.module.css";

export type ExampleEntry = {
  id: string;
  title: string;
  description: string;
  category: string;
};

export type ExampleCategory = {
  id: string;
  label: string;
  examples: ExampleEntry[];
  children?: ExampleCategory[];
};

export type ExampleSelectorProps = {
  examples: ExampleEntry[];
  categories: ExampleCategory[];
  selectedId: string;
  onSelect: (id: string) => void;
};

/**
 * Count all examples in a category including its children
 */
const countExamples = (category: ExampleCategory): number => {
  let count = category.examples.length;
  if (category.children) {
    for (const child of category.children) {
      count += countExamples(child);
    }
  }
  return count;
};

/**
 * Collect all examples from a category and its children
 */
const collectExamples = (category: ExampleCategory): ExampleEntry[] => {
  const result = [...category.examples];
  if (category.children) {
    for (const child of category.children) {
      result.push(...collectExamples(child));
    }
  }
  return result;
};

/**
 * Find a category by id in a nested structure
 */
const findCategory = (categories: ExampleCategory[], id: string): ExampleCategory | null => {
  for (const cat of categories) {
    if (cat.id === id) {
      return cat;
    }
    if (cat.children) {
      const found = findCategory(cat.children, id);
      if (found) {
        return found;
      }
    }
  }
  return null;
};

/**
 * Trigger button that shows the selected example
 */
type SelectorTriggerProps = {
  selectedExample: ExampleEntry | undefined;
  onClick: () => void;
};

const SelectorTrigger: React.FC<SelectorTriggerProps> = ({ selectedExample, onClick }) => {
  return (
    <button type="button" className={styles.trigger} onClick={onClick}>
      <span className={styles.triggerLabel}>
        {selectedExample?.title ?? "Select Example"}
      </span>
      <span className={styles.triggerIcon}>▼</span>
    </button>
  );
};

/**
 * Single category item with optional nesting
 */
type CategoryItemProps = {
  category: ExampleCategory;
  selectedCategoryId: string | null;
  expandedIds: Set<string>;
  onCategorySelect: (id: string) => void;
  onToggleExpand: (id: string) => void;
  depth?: number;
};

const CategoryItem: React.FC<CategoryItemProps> = ({
  category,
  selectedCategoryId,
  expandedIds,
  onCategorySelect,
  onToggleExpand,
  depth = 0,
}) => {
  const hasChildren = category.children && category.children.length > 0;
  const isExpanded = expandedIds.has(category.id);
  const count = countExamples(category);

  const handleClick = () => {
    onCategorySelect(category.id);
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleExpand(category.id);
  };

  return (
    <>
      <div
        className={styles.categoryItem}
        data-selected={selectedCategoryId === category.id}
        data-depth={depth}
        onClick={handleClick}
        style={{ paddingLeft: `calc(var(--node-editor-space-md, 12px) + ${depth * 12}px)` }}
      >
        {hasChildren ? (
          <button
            type="button"
            className={styles.expandButton}
            onClick={handleToggle}
            aria-expanded={isExpanded}
          >
            <span className={styles.expandIcon} data-expanded={isExpanded}>▶</span>
          </button>
        ) : (
          <span className={styles.expandPlaceholder} />
        )}
        <span className={styles.categoryLabel}>{category.label}</span>
        <span className={styles.categoryCount}>{count}</span>
      </div>
      {hasChildren && isExpanded && (
        <div className={styles.categoryChildren}>
          {category.children!.map((child) => (
            <CategoryItem
              key={child.id}
              category={child}
              selectedCategoryId={selectedCategoryId}
              expandedIds={expandedIds}
              onCategorySelect={onCategorySelect}
              onToggleExpand={onToggleExpand}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </>
  );
};

/**
 * Category list on the left side with nested support
 */
type CategoryListProps = {
  categories: ExampleCategory[];
  allExamplesCount: number;
  selectedCategoryId: string | null;
  onCategorySelect: (id: string | null) => void;
};

const CategoryList: React.FC<CategoryListProps> = ({
  categories,
  allExamplesCount,
  selectedCategoryId,
  onCategorySelect,
}) => {
  const [expandedIds, setExpandedIds] = React.useState<Set<string>>(() => {
    // Initially expand top-level categories
    return new Set(categories.map((c) => c.id));
  });

  const handleToggleExpand = React.useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  return (
    <div className={styles.categoryList}>
      <div
        className={styles.categoryItem}
        data-selected={selectedCategoryId === null}
        onClick={() => onCategorySelect(null)}
      >
        <span className={styles.expandPlaceholder} />
        <span className={styles.categoryLabel}>All Examples</span>
        <span className={styles.categoryCount}>{allExamplesCount}</span>
      </div>
      {categories.map((category) => (
        <CategoryItem
          key={category.id}
          category={category}
          selectedCategoryId={selectedCategoryId}
          expandedIds={expandedIds}
          onCategorySelect={onCategorySelect}
          onToggleExpand={handleToggleExpand}
        />
      ))}
    </div>
  );
};

/**
 * Example list on the right side
 */
type ExampleListProps = {
  examples: ExampleEntry[];
  selectedId: string;
  onSelect: (id: string) => void;
  searchQuery: string;
};

const ExampleList: React.FC<ExampleListProps> = ({
  examples,
  selectedId,
  onSelect,
  searchQuery,
}) => {
  const filteredExamples = React.useMemo(() => {
    if (!searchQuery.trim()) {
      return examples;
    }
    const query = searchQuery.toLowerCase();
    return examples.filter(
      (ex) =>
        ex.title.toLowerCase().includes(query) ||
        ex.description.toLowerCase().includes(query)
    );
  }, [examples, searchQuery]);

  if (filteredExamples.length === 0) {
    return (
      <div className={styles.emptyState}>
        No examples match your search
      </div>
    );
  }

  return (
    <div className={styles.exampleList}>
      {filteredExamples.map((example) => (
        <div
          key={example.id}
          className={styles.exampleItem}
          data-selected={example.id === selectedId}
          onClick={() => onSelect(example.id)}
        >
          <div className={styles.exampleTitle}>{example.title}</div>
          <div className={styles.exampleDescription}>{example.description}</div>
        </div>
      ))}
    </div>
  );
};

/**
 * Dropdown menu with split pane layout
 */
type DropdownMenuProps = {
  categories: ExampleCategory[];
  examples: ExampleEntry[];
  selectedId: string;
  onSelect: (id: string) => void;
  onClose: () => void;
};

const DropdownMenu: React.FC<DropdownMenuProps> = ({
  categories,
  examples,
  selectedId,
  onSelect,
  onClose,
}) => {
  const [selectedCategoryId, setSelectedCategoryId] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);

  // Focus search input when menu opens
  React.useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  // Close on click outside
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  // Close on escape
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const displayExamples = React.useMemo(() => {
    if (selectedCategoryId === null) {
      return examples;
    }
    const category = findCategory(categories, selectedCategoryId);
    if (!category) {
      return examples;
    }
    return collectExamples(category);
  }, [examples, categories, selectedCategoryId]);

  const selectedCategoryLabel = React.useMemo(() => {
    if (selectedCategoryId === null) {
      return "All Examples";
    }
    const category = findCategory(categories, selectedCategoryId);
    return category?.label ?? "Examples";
  }, [categories, selectedCategoryId]);

  const handleSelect = React.useCallback(
    (id: string) => {
      onSelect(id);
      onClose();
    },
    [onSelect, onClose]
  );

  return (
    <div ref={menuRef} className={styles.dropdown}>
      <div className={styles.searchHeader}>
        <Input
          ref={searchInputRef}
          type="text"
          placeholder="Search examples…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={styles.searchInput}
        />
      </div>
      <div className={styles.splitPane}>
        <div className={styles.categoryPane}>
          <div className={styles.paneHeader}>Categories</div>
          <CategoryList
            categories={categories}
            allExamplesCount={examples.length}
            selectedCategoryId={selectedCategoryId}
            onCategorySelect={setSelectedCategoryId}
          />
        </div>
        <div className={styles.examplePane}>
          <div className={styles.paneHeader}>{selectedCategoryLabel}</div>
          <ExampleList
            examples={displayExamples}
            selectedId={selectedId}
            onSelect={handleSelect}
            searchQuery={searchQuery}
          />
        </div>
      </div>
    </div>
  );
};

/**
 * Main example selector component
 */
export const ExampleSelector: React.FC<ExampleSelectorProps> = ({
  examples,
  categories,
  selectedId,
  onSelect,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const selectedExample = examples.find((ex) => ex.id === selectedId);

  const handleToggle = React.useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const handleClose = React.useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <div className={styles.container}>
      <SelectorTrigger selectedExample={selectedExample} onClick={handleToggle} />
      {isOpen && (
        <DropdownMenu
          categories={categories}
          examples={examples}
          selectedId={selectedId}
          onSelect={onSelect}
          onClose={handleClose}
        />
      )}
    </div>
  );
};

ExampleSelector.displayName = "ExampleSelector";
