/**
 * @file Theme selector component with dropdown menu
 */
import * as React from "react";
import styles from "./ThemeSelector.module.css";

export type ThemeOption = {
  id: string;
  label: string;
};

export type ThemeSelectorProps = {
  options: ThemeOption[];
  selectedId: string;
  onSelect: (id: string) => void;
};

/**
 * Theme selector with custom dropdown to match ExampleSelector style
 */
export const ThemeSelector: React.FC<ThemeSelectorProps> = ({
  options,
  selectedId,
  onSelect,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.id === selectedId);

  const handleToggle = React.useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const handleSelect = React.useCallback(
    (id: string) => {
      onSelect(id);
      setIsOpen(false);
    },
    [onSelect]
  );

  // Close on click outside
  React.useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Close on escape
  React.useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  return (
    <div className={styles.container} ref={menuRef}>
      <button type="button" className={styles.trigger} onClick={handleToggle}>
        <span className={styles.triggerLabel}>
          {selectedOption?.label ?? "Select Theme"}
        </span>
        <span className={styles.triggerIcon}>▼</span>
      </button>
      {isOpen && (
        <div className={styles.dropdown}>
          {options.map((option) => (
            <div
              key={option.id}
              className={styles.option}
              data-selected={option.id === selectedId}
              onClick={() => handleSelect(option.id)}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

ThemeSelector.displayName = "ThemeSelector";
