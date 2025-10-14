/**
 * @file Constraint violation display component
 */
import * as React from "react";
import type { ConstraintViolation } from "../../types/NodeDefinition";
import { classNames } from "../elements/classNames";
import styles from "./ConstraintViolationDisplay.module.css";

export type ConstraintViolationDisplayProps = {
  violations: ConstraintViolation[];
  onDismiss?: (violationId: string) => void;
  className?: string;
};

/**
 * Component to display constraint violations
 */
export const ConstraintViolationDisplay: React.FC<ConstraintViolationDisplayProps> = ({
  violations,
  onDismiss,
  className,
}) => {
  if (violations.length === 0) {
    return null;
  }

  const getSeverityIcon = (severity: ConstraintViolation["severity"]): string => {
    switch (severity) {
      case "error":
        return "❌";
      case "warning":
        return "⚠️";
      case "info":
        return "ℹ️";
      default:
        return "📋";
    }
  };

  const getSeverityClassName = (severity: ConstraintViolation["severity"]): string => {
    switch (severity) {
      case "error":
        return styles.violationItemError;
      case "warning":
        return styles.violationItemWarning;
      case "info":
        return styles.violationItemInfo;
      default:
        return styles.violationItemDefault;
    }
  };

  return (
    <div className={classNames(styles.constraintViolations, className)}>
      <div className={styles.violationContainer}>
        <h4 className={styles.violationHeader}>Constraint Violations ({violations.length})</h4>

        <div className={styles.violationList}>
          {violations.map((violation, index) => (
            <div
              key={`${violation.type}-${index}`}
              className={classNames(styles.violationItem, getSeverityClassName(violation.severity))}
            >
              <span className={styles.violationIcon}>{getSeverityIcon(violation.severity)}</span>

              <div className={styles.violationContent}>
                <div className={styles.violationType}>{violation.type}</div>

                <div className={styles.violationMessage}>{violation.message}</div>

                {(violation.nodeIds || violation.portIds || violation.connectionIds) && (
                  <div className={styles.violationDetails}>
                    {violation.nodeIds && violation.nodeIds.length > 0 && (
                      <div>Nodes: {violation.nodeIds.join(", ")}</div>
                    )}
                    {violation.portIds && violation.portIds.length > 0 && (
                      <div>Ports: {violation.portIds.join(", ")}</div>
                    )}
                    {violation.connectionIds && violation.connectionIds.length > 0 && (
                      <div>Connections: {violation.connectionIds.join(", ")}</div>
                    )}
                  </div>
                )}
              </div>

              {onDismiss && (
                <button
                  onClick={() => onDismiss(`${violation.type}-${index}`)}
                  className={styles.dismissButton}
                  title="Dismiss"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * Hook to manage constraint violation state
 */
export const useConstraintViolationManager = () => {
  const [violations, setViolations] = React.useState<ConstraintViolation[]>([]);
  const [dismissedViolations, setDismissedViolations] = React.useState<Set<string>>(new Set());

  const addViolations = React.useCallback((newViolations: ConstraintViolation[]) => {
    setViolations((prev) => {
      const combined = [...prev];
      newViolations.forEach((violation) => {
        // Avoid duplicates based on type and message
        const exists = combined.some((v) => v.type === violation.type && v.message === violation.message);
        if (!exists) {
          combined.push(violation);
        }
      });
      return combined;
    });
  }, []);

  const clearViolations = React.useCallback(() => {
    setViolations([]);
    setDismissedViolations(new Set());
  }, []);

  const dismissViolation = React.useCallback((violationId: string) => {
    setDismissedViolations((prev) => new Set([...prev, violationId]));
  }, []);

  const visibleViolations = React.useMemo(() => {
    return violations.filter((_, index) => !dismissedViolations.has(`${violations[index].type}-${index}`));
  }, [violations, dismissedViolations]);

  return {
    violations: visibleViolations,
    addViolations,
    clearViolations,
    dismissViolation,
  };
};
