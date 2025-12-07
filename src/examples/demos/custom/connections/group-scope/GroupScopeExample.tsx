/**
 * @file Group Scope Connection Example
 * Demonstrates how to use canConnect to allow child nodes inside a group
 * to connect to the parent group's scope-in port regardless of data type.
 *
 * Key concept: When `canConnect` is defined on a port, it overrides the default
 * dataType compatibility check. The function receives `dataTypeCompatible`
 * in its context, allowing you to:
 * - Return `true` to accept connections regardless of type
 * - Return `false` to reject connections
 * - Return `dataTypeCompatible` to respect the default behavior
 * - Combine with custom logic: `dataTypeCompatible && customCondition`
 */
import * as React from "react";

import { NodeEditor } from "../../../../../NodeEditor";
import type { NodeEditorData } from "../../../../../types/core";

import { groupScopeDefinitions } from "./groupScopeNodes";
import styles from "./GroupScopeExample.module.css";

/** Initial data demonstrating the group scope pattern */
const initialData: NodeEditorData = {
  nodes: {
    // Group container node
    "group-1": {
      id: "group-1",
      type: "group-container",
      position: { x: 200, y: 100 },
      size: { width: 420, height: 320 },
      data: {},
    },

    // Child nodes inside the group
    "text-1": {
      id: "text-1",
      type: "text-processor",
      position: { x: 240, y: 180 },
      data: {},
      parentId: "group-1",
    },
    "number-1": {
      id: "number-1",
      type: "number-calculator",
      position: { x: 240, y: 280 },
      data: {},
      parentId: "group-1",
    },
    "object-1": {
      id: "object-1",
      type: "object-builder",
      position: { x: 430, y: 230 },
      data: {},
      parentId: "group-1",
    },

    // External nodes
    "source-1": {
      id: "source-1",
      type: "data-source",
      position: { x: 20, y: 180 },
      data: {},
    },
    "receiver-1": {
      id: "receiver-1",
      type: "result-receiver",
      position: { x: 680, y: 220 },
      data: {},
    },

    // Strict typed consumer (demonstrates default dataType checking)
    "strict-1": {
      id: "strict-1",
      type: "strict-typed-consumer",
      position: { x: 680, y: 350 },
      data: {},
    },

    // Another number calculator for comparison
    "number-2": {
      id: "number-2",
      type: "number-calculator",
      position: { x: 460, y: 350 },
      data: {},
    },
  },
  connections: {
    // External source to group input
    "conn-source-group": {
      id: "conn-source-group",
      fromNodeId: "source-1",
      fromPortId: "output",
      toNodeId: "group-1",
      toPortId: "data-in",
    },

    // Group scope-out to child text processor
    "conn-scope-text": {
      id: "conn-scope-text",
      fromNodeId: "group-1",
      fromPortId: "scope-out",
      toNodeId: "text-1",
      toPortId: "input",
    },

    // Child text processor to group scope-in (string -> result)
    // This works because scope-in has canConnect: () => true
    "conn-text-scope": {
      id: "conn-text-scope",
      fromNodeId: "text-1",
      fromPortId: "output",
      toNodeId: "group-1",
      toPortId: "scope-in",
    },

    // Group output to external receiver
    "conn-group-receiver": {
      id: "conn-group-receiver",
      fromNodeId: "group-1",
      fromPortId: "data-out",
      toNodeId: "receiver-1",
      toPortId: "input",
    },

    // Number calculator to strict consumer (number -> number)
    // This works because types match
    "conn-number-strict": {
      id: "conn-number-strict",
      fromNodeId: "number-2",
      fromPortId: "output",
      toNodeId: "strict-1",
      toPortId: "input",
    },
  },
};

/** Example component demonstrating group scope connections with canConnect */
export function GroupScopeExample(): React.ReactElement {
  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <h2 className={styles.title}>Group Scope Connection Example</h2>
        <p className={styles.description}>
          Demonstrates <code>canConnect</code> overriding default dataType checking.
          The group&apos;s &quot;From Children&quot; port accepts any type because it defines{" "}
          <code>canConnect: () =&gt; true</code>.
        </p>
        <pre className={styles.codeBlock}>
          {`// scope-in port definition
{
  id: "scope-in",
  type: "input",
  dataType: "result",  // Normally wouldn't match "string" or "number"
  canConnect: () => true,  // Overrides dataType check - accepts any type
}`}
        </pre>
      </div>

      <div className={styles.editorContainer}>
        <NodeEditor
          includeDefaultDefinitions={false}
          nodeDefinitions={groupScopeDefinitions}
          initialData={initialData}
        />
      </div>

      <div className={styles.legend}>
        <div className={styles.legendItem}>
          <span className={`${styles.legendDot} ${styles.legendDotGroup}`} />
          <span>Group Container (scope ports)</span>
        </div>
        <div className={styles.legendItem}>
          <span className={`${styles.legendDot} ${styles.legendDotChild}`} />
          <span>Child Processors (various types)</span>
        </div>
        <div className={styles.legendItem}>
          <span className={`${styles.legendDot} ${styles.legendDotExternal}`} />
          <span>External nodes</span>
        </div>
        <div className={styles.legendItem}>
          <span className={`${styles.legendDot} ${styles.legendDotStrict}`} />
          <span>Strict Consumer (number only)</span>
        </div>
      </div>

      <div className={styles.instructions}>
        <strong>Try these interactions:</strong>
        <ul className={styles.instructionsList}>
          <li>
            Drag from <span className={styles.highlight}>Number Calculator</span> or{" "}
            <span className={styles.highlight}>Object Builder</span> output to the group&apos;s{" "}
            <span className={styles.highlight}>&quot;From Children&quot;</span> port - it accepts any type!
          </li>
          <li>
            Drag from <span className={styles.highlight}>Text Processor</span> (string) to{" "}
            <span className={styles.highlight}>Strict Consumer</span> (number) - it will be rejected due to type
            mismatch.
          </li>
          <li>
            The <span className={styles.highlight}>Strict Consumer</span> only accepts number type because it
            doesn&apos;t define <code>canConnect</code>.
          </li>
        </ul>
      </div>
    </div>
  );
}
