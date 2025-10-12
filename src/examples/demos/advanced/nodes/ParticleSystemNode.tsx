/**
 * @file Particle System Node - Interactive particle effect simulator with custom physics
 */
import * as React from "react";
import type { NodeDefinition, NodeRenderProps, InspectorRenderProps } from "../../../../types/NodeDefinition";
import classes from "./ParticleSystemNode.module.css";
import { createDefaultParticleData, defaultPhysics, sanitizeParticleData, type ParticleData } from "./ParticleSystemDataStore";
export type { ParticleData } from "./ParticleSystemDataStore";
import { useParticleSystemStore } from "../contexts/ParticleSystemStoreContext";

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
};

const colorToRgba = (color: string, alpha: number) => {
  if (color.startsWith("#")) {
    const normalized =
      color.length === 4 ? `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}` : color;
    const r = parseInt(normalized.slice(1, 3), 16);
    const g = parseInt(normalized.slice(3, 5), 16);
    const b = parseInt(normalized.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  if (color.startsWith("rgba")) {
    return color.replace(/rgba\(([^,]+),\s*([^,]+),\s*([^,]+),[^)]+\)/, `rgba($1, $2, $3, ${alpha})`);
  }

  if (color.startsWith("rgb")) {
    return color.replace("rgb", "rgba").replace(")", `, ${alpha})`);
  }

  return color;
};

const areParticleConfigsEqual = (a?: ParticleData | null, b?: ParticleData | null): boolean => {
  if (a === b) {
    return true;
  }
  if (!a || !b) {
    return false;
  }
  return JSON.stringify(a) === JSON.stringify(b);
};

export const ParticleSystemRenderer = ({ node, isSelected, isDragging }: NodeRenderProps) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const particlesRef = React.useRef<Particle[]>([]);
  const animationRef = React.useRef<number | undefined>(undefined);
  const [emitPosition, setEmitPosition] = React.useState({ x: 50, y: 50 });
  const prevTriggersRef = React.useRef({ a: false, b: false });

  // Get input data from node.data (set by connected nodes)
  const positionInput = node.data["position-input"] as { x: number; y: number } | undefined;
  const emitTriggerA = node.data["emit-a-input"] as boolean | undefined;
  const emitTriggerB = node.data["emit-b-input"] as boolean | undefined;
  const emitCountInput = node.data["count-input"] as number | undefined;
  const physicsCodeInput = node.data["physics-code-input"] as string | undefined;
  const sizeInput = node.data["size-input"] as number | undefined;
  const colorInput = node.data["color-input"] as string | undefined;
  const store = useParticleSystemStore();
  const externalRefId = (node.data["externalRefId"] as string | undefined) ?? node.id;

  const rawConfig = store.getData(externalRefId);
  const particleConfig = React.useMemo(
    () =>
      sanitizeParticleData(
        rawConfig ?? createDefaultParticleData(externalRefId),
        externalRefId,
        rawConfig ?? undefined,
      ),
    [externalRefId, rawConfig],
  );

  React.useEffect(() => {
    if (!rawConfig) {
      store.setData(externalRefId, particleConfig);
      return;
    }
    if (!areParticleConfigsEqual(rawConfig, particleConfig)) {
      store.setData(externalRefId, particleConfig);
    }
  }, [externalRefId, particleConfig, rawConfig, store]);

  const updateParticleConfig = React.useCallback(
    (updater: (current: ParticleData) => ParticleData) => {
      store.updateData(externalRefId, (current) => {
        const baseline = sanitizeParticleData(
          current ?? createDefaultParticleData(externalRefId),
          externalRefId,
          current ?? undefined,
        );
        return sanitizeParticleData(updater(baseline), externalRefId, baseline);
      });
    },
    [externalRefId, store],
  );

  const targetEmitCount = emitCountInput ?? particleConfig.emitCount ?? 0;
  const resolvedParticleSize = sizeInput ?? particleConfig.particleSize ?? 4;
  const resolvedParticleColor = colorInput ?? particleConfig.particleColor ?? "rgb(168, 85, 247)";

  const displayEmitCount = particleConfig.lastEmitCount ?? targetEmitCount;

  // Update emit position from position input
  React.useEffect(() => {
    if (positionInput) {
      setEmitPosition(positionInput);
      return;
    }

    setEmitPosition({ x: particleConfig.emitX, y: particleConfig.emitY });
  }, [positionInput, particleConfig.emitX, particleConfig.emitY]);

  const emitParticles = React.useCallback(
    (count?: number) => {
      if (!canvasRef.current) {
        return;
      }

      const canvas = canvasRef.current;
      const emitX = (emitPosition.x / 100) * canvas.width;
      const emitY = (emitPosition.y / 100) * canvas.height;
      const resolvedCount = count ?? emitCountInput ?? particleConfig.emitCount ?? 0;

      for (let i = 0; i < resolvedCount; i++) {
        particlesRef.current.push({
          x: emitX,
          y: emitY,
          vx: (Math.random() - 0.5) * 6,
          vy: (Math.random() - 0.5) * 6 - 2,
          life: 1,
          maxLife: particleConfig.lifetime,
        });
      }

      updateParticleConfig((current) => ({
        ...current,
        lastEmitCount: resolvedCount,
      }));
    },
    [emitCountInput, emitPosition, particleConfig, updateParticleConfig],
  );

  // Handle emit triggers from A and B inputs
  React.useEffect(() => {
    const currentA = emitTriggerA || false;
    const currentB = emitTriggerB || false;

    // Detect rising edge (false -> true transition)
    if (currentA && !prevTriggersRef.current.a) {
      const count = emitCountInput ?? particleConfig.emitCount ?? 10;
      emitParticles(count);
    }

    if (currentB && !prevTriggersRef.current.b) {
      const count = (emitCountInput ?? particleConfig.emitCount ?? 10) * 2;
      emitParticles(count);
    }

    prevTriggersRef.current = { a: currentA, b: currentB };
  }, [emitTriggerA, emitTriggerB, emitCountInput, particleConfig.emitCount, emitParticles]);

  // Create physics update function from code (prioritize input from node)
  const physicsUpdate = React.useMemo(() => {
    const code = physicsCodeInput || particleConfig.physicsCode || defaultPhysics;
    try {
      return new Function("particle", "gravity", "lifetime", code) as (
        particle: Particle,
        gravity: number,
        lifetime: number,
      ) => void;
    } catch (error) {
      console.error("Failed to compile physics code:", error);
      return new Function("particle", "gravity", "lifetime", defaultPhysics) as (
        particle: Particle,
        gravity: number,
        lifetime: number,
      ) => void;
    }
  }, [physicsCodeInput, particleConfig.physicsCode]);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    const width = canvas.width;
    const height = canvas.height;

    const animate = () => {
      ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
      ctx.fillRect(0, 0, width, height);

      // Auto-emit particles if enabled
      if (particleConfig.autoEmit && Math.random() > 0.8) {
        emitParticles();
      }

      // Update and draw particles
      particlesRef.current = particlesRef.current.filter((particle) => {
        // Apply custom physics
        physicsUpdate(particle, particleConfig.gravity, particleConfig.lifetime);

        if (particle.life <= 0) {
          return false;
        }

        const alpha = particle.life;
        ctx.fillStyle = colorToRgba(resolvedParticleColor, alpha);

        switch (particleConfig.shape) {
          case "circle":
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, resolvedParticleSize, 0, Math.PI * 2);
            ctx.fill();
            break;
          case "square":
            ctx.fillRect(
              particle.x - resolvedParticleSize / 2,
              particle.y - resolvedParticleSize / 2,
              resolvedParticleSize,
              resolvedParticleSize,
            );
            break;
          case "star":
            ctx.font = `${resolvedParticleSize}px Arial`;
            ctx.fillText("⭐", particle.x, particle.y);
            break;
        }

        return true;
      });

      // Draw emit position crosshair
      const emitX = (emitPosition.x / 100) * width;
      const emitY = (emitPosition.y / 100) * height;

      ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(emitX - 10, emitY);
      ctx.lineTo(emitX + 10, emitY);
      ctx.moveTo(emitX, emitY - 10);
      ctx.lineTo(emitX, emitY + 10);
      ctx.stroke();

      // Draw position info text
      ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
      ctx.font = "11px monospace";
      ctx.fillText(`Emit: (${Math.round(emitPosition.x)}, ${Math.round(emitPosition.y)})`, 8, 18);
      ctx.fillText(`Particles: ${particlesRef.current.length}`, 8, 32);

      if (positionInput) {
        ctx.fillStyle = "rgba(100, 255, 100, 0.9)";
        ctx.fillText(`Input: (${Math.round(positionInput.x)}, ${Math.round(positionInput.y)})`, 8, 46);
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [
    emitParticles,
    physicsUpdate,
    emitPosition,
    particleConfig,
    positionInput,
    resolvedParticleColor,
    resolvedParticleSize,
  ]);

  const handleEmit = () => {
    emitParticles(targetEmitCount);
  };

  return (
    <div
      className={`${classes.container} ${isSelected ? classes.selected : ""} ${isDragging ? classes.dragging : ""}`}
      style={{
        width: node.size?.width,
        height: node.size?.height,
      }}
    >
      <div className={classes.header}>
        <div className={classes.title}>✨ Particle System</div>
        <div className={classes.badge}>{particlesRef.current.length} active</div>
      </div>

      <canvas ref={canvasRef} width={260} height={140} className={classes.canvas} />

      <div className={classes.inputDisplay}>
        {positionInput && (
          <div className={classes.inputItem}>
            📍 ({Math.round(positionInput.x)}, {Math.round(positionInput.y)})
          </div>
        )}
        {emitTriggerA !== undefined && (
          <div className={`${classes.inputItem} ${emitTriggerA ? classes.triggerActive : ""}`}>
            A: {emitTriggerA ? "🟢" : "⚫"}
          </div>
        )}
        {emitTriggerB !== undefined && (
          <div className={`${classes.inputItem} ${emitTriggerB ? classes.triggerActive : ""}`}>
            B: {emitTriggerB ? "🟢" : "⚫"}
          </div>
        )}
        <div className={classes.inputItem}>Count: {displayEmitCount}</div>
        <div className={classes.inputItem}>Size: {resolvedParticleSize}px</div>
        <div className={classes.inputItem}>Color: {resolvedParticleColor}</div>
        {physicsCodeInput && <div className={classes.inputItem}>📝 Custom Physics</div>}
      </div>

      <div className={classes.controls}>
        <button onClick={handleEmit} className={classes.emitButton} type="button">
          💥 Emit ({targetEmitCount})
        </button>
      </div>
    </div>
  );
};

export const ParticleSystemInspectorRenderer = ({ node }: InspectorRenderProps) => {
  const store = useParticleSystemStore();
  const externalRefId = (node.data["externalRefId"] as string | undefined) ?? node.id;
  const storeConfig = store.getData(externalRefId);
  const [editedData, setEditedData] = React.useState<ParticleData>(
    storeConfig ? sanitizeParticleData(storeConfig, externalRefId, storeConfig) : createDefaultParticleData(externalRefId),
  );

  React.useEffect(() => {
    if (!storeConfig) {
      return;
    }
    setEditedData(sanitizeParticleData(storeConfig, externalRefId, storeConfig));
  }, [externalRefId, storeConfig]);

  const handleSave = () => {
    const targetId = externalRefId;
    const prepared = sanitizeParticleData({ ...editedData, id: targetId }, targetId, storeConfig);
    setEditedData(prepared);
    store.setData(targetId, prepared);
  };

  const hasInputs =
    node.data["position-input"] !== undefined ||
    node.data["emit-a-input"] !== undefined ||
    node.data["emit-b-input"] !== undefined ||
    node.data["count-input"] !== undefined ||
    node.data["size-input"] !== undefined ||
    node.data["color-input"] !== undefined ||
    node.data["physics-code-input"] !== undefined;

  return (
    <div className={classes.inspector}>
      <h3>Particle System</h3>

      {hasInputs && (
        <div className={classes.inputInfo}>
          <div className={classes.label}>Connected Inputs:</div>
          {node.data["position-input"] ? (
            <div className={classes.inputValue}>
              Position: ({Math.round((node.data["position-input"] as { x: number; y: number }).x)},{" "}
              {Math.round((node.data["position-input"] as { x: number; y: number }).y)})
            </div>
          ) : null}
          {node.data["emit-a-input"] !== undefined && (
            <div className={classes.inputValue}>A Trigger: {String(node.data["emit-a-input"])}</div>
          )}
          {node.data["emit-b-input"] !== undefined && (
            <div className={classes.inputValue}>B Trigger: {String(node.data["emit-b-input"])}</div>
          )}
          {node.data["count-input"] !== undefined && (
            <div className={classes.inputValue}>Emit Count: {String(node.data["count-input"])}</div>
          )}
          {node.data["size-input"] !== undefined && (
            <div className={classes.inputValue}>Particle Size: {String(node.data["size-input"])}px</div>
          )}
          {node.data["color-input"] !== undefined && (
            <div className={classes.inputValue}>Particle Color: {String(node.data["color-input"])}</div>
          )}
          {node.data["physics-code-input"] !== undefined && (
            <div className={classes.inputValue}>Physics Code Input: Connected</div>
          )}
        </div>
      )}

      <div className={classes.inputInfo}>
        <div className={classes.label}>Last Emission:</div>
        <div className={classes.inputValue}>
          {storeConfig?.lastEmitCount !== undefined ? `${storeConfig.lastEmitCount} particles` : "No emissions yet"}
        </div>
      </div>

      <div className={classes.formGroup}>
        <label htmlFor="emit-x" className={classes.label}>
          Default Emit X: {editedData.emitX}%
        </label>
        <input
          id="emit-x"
          name="emitX"
          type="range"
          min="0"
          max="100"
          value={editedData.emitX}
          onChange={(e) => setEditedData({ ...editedData, emitX: Number(e.target.value) })}
          className={classes.slider}
        />
      </div>

      <div className={classes.formGroup}>
        <label htmlFor="emit-y" className={classes.label}>
          Default Emit Y: {editedData.emitY}%
        </label>
        <input
          id="emit-y"
          name="emitY"
          type="range"
          min="0"
          max="100"
          value={editedData.emitY}
          onChange={(e) => setEditedData({ ...editedData, emitY: Number(e.target.value) })}
          className={classes.slider}
        />
      </div>

      <div className={classes.formGroup}>
        <label htmlFor="emit-count" className={classes.label}>
          Default Emit Count: {editedData.emitCount}
        </label>
        <input
          id="emit-count"
          name="emitCount"
          type="range"
          min="1"
          max="50"
          value={editedData.emitCount}
          onChange={(e) => setEditedData({ ...editedData, emitCount: Number(e.target.value) })}
          className={classes.slider}
        />
      </div>

      <div className={classes.formGroup}>
        <label htmlFor="particle-size" className={classes.label}>
          Particle Size: {editedData.particleSize}px
        </label>
        <input
          id="particle-size"
          name="particleSize"
          type="range"
          min="1"
          max="20"
          value={editedData.particleSize}
          onChange={(e) => setEditedData({ ...editedData, particleSize: Number(e.target.value) })}
          className={classes.slider}
        />
      </div>

      <div className={classes.formGroup}>
        <label htmlFor="particle-gravity" className={classes.label}>
          Gravity: {editedData.gravity}
        </label>
        <input
          id="particle-gravity"
          name="particleGravity"
          type="range"
          min="-2"
          max="2"
          step="0.1"
          value={editedData.gravity}
          onChange={(e) => setEditedData({ ...editedData, gravity: Number(e.target.value) })}
          className={classes.slider}
        />
      </div>

      <div className={classes.formGroup}>
        <label htmlFor="particle-lifetime" className={classes.label}>
          Lifetime: {editedData.lifetime}s
        </label>
        <input
          id="particle-lifetime"
          name="particleLifetime"
          type="range"
          min="0.5"
          max="5"
          step="0.1"
          value={editedData.lifetime}
          onChange={(e) => setEditedData({ ...editedData, lifetime: Number(e.target.value) })}
          className={classes.slider}
        />
      </div>

      <div className={classes.formGroup}>
        <label htmlFor="particle-color" className={classes.label}>
          Color:
        </label>
        <input
          id="particle-color"
          name="particleColor"
          type="color"
          value={editedData.particleColor.startsWith("#") ? editedData.particleColor : "#a855f7"}
          onChange={(e) => {
            const hex = e.target.value;
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            setEditedData({ ...editedData, particleColor: `rgb(${r}, ${g}, ${b})` });
          }}
          className={classes.colorInput}
        />
      </div>

      <div className={classes.formGroup}>
        <label htmlFor="particle-shape" className={classes.label}>
          Shape:
        </label>
        <select
          id="particle-shape"
          name="particleShape"
          value={editedData.shape}
          onChange={(e) => setEditedData({ ...editedData, shape: e.target.value as ParticleData["shape"] })}
          className={classes.select}
        >
          <option value="circle">Circle</option>
          <option value="square">Square</option>
          <option value="star">Star</option>
        </select>
      </div>

      <div className={classes.formGroup}>
        <label className={classes.checkboxLabel}>
          <input
            type="checkbox"
            checked={editedData.autoEmit}
            onChange={(e) => setEditedData({ ...editedData, autoEmit: e.target.checked })}
          />
          Auto Emit
        </label>
      </div>

      <div className={classes.formGroup}>
        <label htmlFor="physics-code" className={classes.label}>
          Physics Code (JavaScript):
        </label>
        <textarea
          id="physics-code"
          name="physicsCode"
          value={editedData.physicsCode}
          onChange={(e) => setEditedData({ ...editedData, physicsCode: e.target.value })}
          className={classes.codeEditor}
          placeholder={defaultPhysics}
          rows={6}
        />
        <div className={classes.codeHint}>Available: particle, gravity, lifetime</div>
      </div>

      <button onClick={handleSave} className={classes.saveButton}>
        Save Changes
      </button>
    </div>
  );
};

export const ParticleSystemNodeDefinition: NodeDefinition = {
  type: "particle-system",
  displayName: "Particle System",
  description: "Interactive particle effect with custom physics and multiple inputs",
  category: "Effects",
  defaultData: {
    title: "Particle System",
  },
  defaultSize: { width: 280, height: 220 },
  ports: [
    {
      id: "position-input",
      type: "input",
      label: "Position",
      position: "left",
    },
    {
      id: "emit-a-input",
      type: "input",
      label: "Emit A",
      position: "left",
    },
    {
      id: "emit-b-input",
      type: "input",
      label: "Emit B",
      position: "left",
    },
    {
      id: "count-input",
      type: "input",
      label: "Count",
      position: "left",
    },
    {
      id: "size-input",
      type: "input",
      label: "Size",
      position: "left",
    },
    {
      id: "color-input",
      type: "input",
      label: "Color",
      position: "left",
    },
    {
      id: "physics-code-input",
      type: "input",
      label: "Physics Code",
      position: "left",
    },
    {
      id: "effect-output",
      type: "output",
      label: "Effect",
      position: "right",
    },
  ],
  renderNode: ParticleSystemRenderer,
  renderInspector: ParticleSystemInspectorRenderer,
};

// Debug Notes:
// - Revisited src/components/node/NodeView.tsx to ensure removing loadExternalData would not break renderer updates.
// - Checked src/types/NodeDefinition.ts to confirm optional load/update fields keep type safety after the refactor.
