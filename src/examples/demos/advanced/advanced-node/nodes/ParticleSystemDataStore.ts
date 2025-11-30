/**
 * @file Data types and utilities for the particle system node
 */
export type ParticleData = {
  id: string;
  emitX: number;
  emitY: number;
  emitCount: number;
  particleSize: number;
  particleColor: string;
  gravity: number;
  lifetime: number;
  shape: "circle" | "square" | "star";
  autoEmit: boolean;
  physicsCode?: string;
  positionInput?: { x: number; y: number };
  emitTriggerA?: boolean;
  emitTriggerB?: boolean;
  emitCountInput?: number;
  physicsCodeInput?: string;
  particleSizeInput?: number;
  particleColorInput?: string;
  lastEmitCount?: number;
};

export const defaultPhysics = `
// Update particle physics
particle.x += particle.vx;
particle.y += particle.vy;
particle.vy += gravity * 0.1;
particle.life -= 1 / (lifetime * 60);
`;

export const createDefaultParticleData = (id: string): ParticleData => ({
  id,
  emitX: 50,
  emitY: 30,
  emitCount: 10,
  particleSize: 4,
  particleColor: "rgb(168, 85, 247)",
  gravity: 0.5,
  lifetime: 2,
  shape: "circle",
  autoEmit: false,
  physicsCode: defaultPhysics,
  lastEmitCount: undefined,
});

const isFiniteNumber = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const isValidShape = (value: unknown): value is ParticleData["shape"] =>
  value === "circle" || value === "square" || value === "star";

export const sanitizeParticleData = (candidate: unknown, id: string, fallback?: ParticleData): ParticleData => {
  const baseline = fallback ?? createDefaultParticleData(id);

  if (!candidate || typeof candidate !== "object") {
    return baseline;
  }

  const data = candidate as Partial<ParticleData>;

  const emitX = isFiniteNumber(data.emitX) ? clamp(data.emitX, 0, 100) : baseline.emitX;
  const emitY = isFiniteNumber(data.emitY) ? clamp(data.emitY, 0, 100) : baseline.emitY;
  const emitCount = isFiniteNumber(data.emitCount) ? Math.max(0, Math.round(data.emitCount)) : baseline.emitCount;
  const particleSize = isFiniteNumber(data.particleSize) ? Math.max(1, data.particleSize) : baseline.particleSize;
  const gravity = isFiniteNumber(data.gravity) ? clamp(data.gravity, -10, 10) : baseline.gravity;
  const lifetime = isFiniteNumber(data.lifetime) ? Math.max(0.1, data.lifetime) : baseline.lifetime;
  const lastEmitCount = isFiniteNumber(data.lastEmitCount)
    ? Math.max(0, Math.round(data.lastEmitCount))
    : baseline.lastEmitCount;

  return {
    id,
    emitX,
    emitY,
    emitCount,
    particleSize,
    particleColor: typeof data.particleColor === "string" ? data.particleColor : baseline.particleColor,
    gravity,
    lifetime,
    shape: isValidShape(data.shape) ? data.shape : baseline.shape,
    autoEmit: typeof data.autoEmit === "boolean" ? data.autoEmit : baseline.autoEmit,
    physicsCode: typeof data.physicsCode === "string" ? data.physicsCode : baseline.physicsCode,
    lastEmitCount,
    positionInput: data.positionInput,
    emitTriggerA: data.emitTriggerA,
    emitTriggerB: data.emitTriggerB,
    emitCountInput: data.emitCountInput,
    physicsCodeInput: data.physicsCodeInput,
    particleSizeInput: data.particleSizeInput,
    particleColorInput: data.particleColorInput,
  };
};
