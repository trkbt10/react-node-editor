/**
 * @file Material configuration helpers for the Three.js demo teapot.
 */

export type MaterialMode = "standard" | "glass" | "hologram";

export type MaterialConfig = {
  mode: MaterialMode;
  metalness: number;
  roughness: number;
  clearcoat: number;
  clearcoatRoughness: number;
  transmission: number;
  thickness: number;
  envMapIntensity: number;
  emissive: string;
  emissiveIntensity: number;
  opacity: number;
  pulseSpeed: number;
  pulseStrength: number;
};

const clampNumber = (value: number, min: number, max: number): number => {
  if (!Number.isFinite(value)) {
    return min;
  }
  if (value < min) {
    return min;
  }
  if (value > max) {
    return max;
  }
  return value;
};

const cloneConfig = (config: MaterialConfig): MaterialConfig => {
  return {
    ...config,
  };
};

export const MATERIAL_PRESETS: Record<MaterialMode, MaterialConfig> = {
  standard: {
    mode: "standard",
    metalness: 0.45,
    roughness: 0.32,
    clearcoat: 0.2,
    clearcoatRoughness: 0.35,
    transmission: 0,
    thickness: 0,
    envMapIntensity: 0.6,
    emissive: "#0f172a",
    emissiveIntensity: 0.18,
    opacity: 1,
    pulseSpeed: 0,
    pulseStrength: 0,
  },
  glass: {
    mode: "glass",
    metalness: 0.08,
    roughness: 0.12,
    clearcoat: 0.92,
    clearcoatRoughness: 0.18,
    transmission: 0.92,
    thickness: 2.6,
    envMapIntensity: 1.4,
    emissive: "#1e293b",
    emissiveIntensity: 0.32,
    opacity: 0.58,
    pulseSpeed: 0.0015,
    pulseStrength: 0.12,
  },
  hologram: {
    mode: "hologram",
    metalness: 0.22,
    roughness: 0.18,
    clearcoat: 0.95,
    clearcoatRoughness: 0.08,
    transmission: 0.58,
    thickness: 1.6,
    envMapIntensity: 1.8,
    emissive: "#22d3ee",
    emissiveIntensity: 1.85,
    opacity: 0.42,
    pulseSpeed: 0.0032,
    pulseStrength: 0.75,
  },
};

const clampMaterialValues = (config: MaterialConfig): MaterialConfig => {
  return {
    ...config,
    metalness: clampNumber(config.metalness, 0, 1),
    roughness: clampNumber(config.roughness, 0, 1),
    clearcoat: clampNumber(config.clearcoat, 0, 1),
    clearcoatRoughness: clampNumber(config.clearcoatRoughness, 0, 1),
    transmission: clampNumber(config.transmission, 0, 1),
    thickness: clampNumber(config.thickness, 0, 10),
    envMapIntensity: clampNumber(config.envMapIntensity, 0, 4),
    emissiveIntensity: clampNumber(config.emissiveIntensity, 0, 5),
    opacity: clampNumber(config.opacity, 0.1, 1),
    pulseSpeed: clampNumber(config.pulseSpeed, 0, 0.01),
    pulseStrength: clampNumber(config.pulseStrength, 0, 3),
  };
};

export const getMaterialPreset = (mode: MaterialMode): MaterialConfig => {
  return cloneConfig(MATERIAL_PRESETS[mode]);
};

export type MaterialConfigInput = Partial<Omit<MaterialConfig, "mode">> & {
  mode?: MaterialMode;
};

export const mergeMaterialConfig = (input: MaterialConfigInput): MaterialConfig => {
  const mode = input.mode ?? "standard";
  const base = getMaterialPreset(mode);

  return clampMaterialValues({
    ...base,
    ...input,
    mode,
  });
};

export const DEFAULT_MATERIAL_CONFIG = getMaterialPreset("standard");
