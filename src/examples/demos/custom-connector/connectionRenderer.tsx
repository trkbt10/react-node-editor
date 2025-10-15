/**
 * @file Custom connection renderer that uses Three.js to render volumetric bezier conduits.
 */
import * as React from "react";
import {
  AdditiveBlending,
  AmbientLight,
  Color,
  Mesh,
  MeshPhysicalMaterial,
  PerspectiveCamera,
  PointLight,
  Scene,
  Vector3,
  WebGLRenderer,
  CatmullRomCurve3,
  TubeGeometry,
  SphereGeometry,
} from "three";
import type { ConnectionRenderContext } from "../../../types/NodeDefinition";
import {
  calculateBezierPath,
  calculateBezierControlPoints,
  cubicBezierPoint,
  cubicBezierTangent,
  getOppositePortPosition,
} from "../../../components/connection/utils/connectionUtils";
import styles from "./CustomConnectorExample.module.css";

type AnimationPhase = "idle" | "hovered" | "selected";

type GeometryData = {
  originX: number;
  originY: number;
  width: number;
  height: number;
  localPoints: Vector3[];
  key: string;
  pathData: string;
};

const MIN_CANVAS_SIZE = 200;
const CANVAS_PADDING = 100;
const UP_AXIS = new Vector3(0, 0, 1);

const PHASE_SETTINGS: Record<AnimationPhase, { emissiveBoost: number; glowBoost: number; speed: number; depthShift: number }> =
  {
    idle: {
      emissiveBoost: 0.6,
      glowBoost: 0.25,
      speed: 0.4,
      depthShift: 28,
    },
    hovered: {
      emissiveBoost: 1.2,
      glowBoost: 0.45,
      speed: 0.8,
      depthShift: 46,
    },
    selected: {
      emissiveBoost: 1.8,
      glowBoost: 0.65,
      speed: 1.4,
      depthShift: 72,
    },
  };

const getGeometryData = (
  from: { x: number; y: number },
  to: { x: number; y: number },
  cp1: { x: number; y: number },
  cp2: { x: number; y: number },
  fromPortPosition?: "left" | "right" | "top" | "bottom",
  toPortPosition?: "left" | "right" | "top" | "bottom",
): GeometryData => {
  const minX = Math.min(from.x, to.x, cp1.x, cp2.x);
  const maxX = Math.max(from.x, to.x, cp1.x, cp2.x);
  const minY = Math.min(from.y, to.y, cp1.y, cp2.y);
  const maxY = Math.max(from.y, to.y, cp1.y, cp2.y);

  const spanX = Math.max(1, maxX - minX);
  const spanY = Math.max(1, maxY - minY);

  const width = Math.max(MIN_CANVAS_SIZE, spanX + CANVAS_PADDING);
  const height = Math.max(MIN_CANVAS_SIZE, spanY + CANVAS_PADDING);

  const centerX = minX + spanX * 0.5;
  const centerY = minY + spanY * 0.5;

  const minSpan = Math.min(width, height);
  const baseRadiusEstimate = Math.max(10, minSpan * 0.04);
  const depthAmplitude = Math.min(160, Math.max(80, baseRadiusEstimate * 5.5));
  const swirlAmplitude = Math.min(28, Math.max(12, baseRadiusEstimate * 1.4));
  const sampleCount = 24;
  const localPoints: Vector3[] = [];

  for (let index = 0; index < sampleCount; index += 1) {
    const t = index / (sampleCount - 1);
    const envelope = Math.sin(Math.PI * t);
    const basePoint = cubicBezierPoint(from, cp1, cp2, to, t);
    const tangent2d = cubicBezierTangent(from, cp1, cp2, to, t);

    const tangent = new Vector3(tangent2d.x, -tangent2d.y, 0);
    if (tangent.lengthSq() < 1e-6) {
      tangent.set(1, 0, 0);
    } else {
      tangent.normalize();
    }

    let normal = new Vector3().crossVectors(UP_AXIS, tangent);
    if (normal.lengthSq() < 1e-6) {
      normal = new Vector3(0, 1, 0);
    } else {
      normal.normalize();
    }

    const binormal = new Vector3().crossVectors(tangent, normal).normalize();

    const depth = Math.sin(t * Math.PI) * depthAmplitude + Math.cos(t * Math.PI * 1.8) * (depthAmplitude * 0.12);
    const swirl = Math.sin(t * Math.PI * 2.6) * swirlAmplitude * envelope * 0.85;
    const lift = Math.cos(t * Math.PI * 3.8 + Math.PI / 4) * swirlAmplitude * 0.32 * envelope;

    const position = new Vector3(basePoint.x - centerX, -(basePoint.y - centerY), depth);
    position.add(normal.clone().multiplyScalar(swirl));
    position.add(binormal.clone().multiplyScalar(lift));

    localPoints.push(position);
  }

  const pathData = calculateBezierPath(from, to, fromPortPosition, toPortPosition);

  return {
    originX: centerX - width / 2,
    originY: centerY - height / 2,
    width,
    height,
    localPoints,
    key: `${Math.round(centerX)}:${Math.round(centerY)}:${Math.round(width)}:${Math.round(height)}:${Math.round(
      cp1.x,
    )}:${Math.round(cp1.y)}:${Math.round(cp2.x)}:${Math.round(cp2.y)}`,
    pathData,
  };
};

type SceneBundle = {
  renderer: WebGLRenderer;
  scene: Scene;
  camera: PerspectiveCamera;
  coreMesh: Mesh<TubeGeometry, MeshPhysicalMaterial>;
  haloMesh: Mesh<TubeGeometry, MeshPhysicalMaterial>;
  curve: CatmullRomCurve3;
  pulseGeometry: SphereGeometry;
  pulseMeshes: Array<Mesh<SphereGeometry, MeshPhysicalMaterial>>;
  pulseMaterials: MeshPhysicalMaterial[];
  frameId: number | null;
  dispose: () => void;
  updateGeometry: (geometry: GeometryData) => void;
};

const createBundle = (
  canvas: HTMLCanvasElement,
  geometry: GeometryData,
  phaseRef: React.MutableRefObject<AnimationPhase>,
): SceneBundle => {
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(typeof window !== "undefined" ? window.devicePixelRatio : 1);
  renderer.setSize(geometry.width, geometry.height, false);

  const scene = new Scene();
  scene.background = null;

  const camera = new PerspectiveCamera(48, geometry.width / geometry.height, 0.1, 2000);
  camera.position.set(0, 0, 620);
  camera.lookAt(new Vector3(0, 0, 0));

  const computeParameters = (geom: GeometryData) => {
    const nextCurve = new CatmullRomCurve3(geom.localPoints, false, "catmullrom", 0.42);
    const approximateLength = nextCurve.getLength();
    const tubularSegments = Math.max(220, Math.round(approximateLength * 1.2));
    const radialSegments = 96;
    const baseRadius = Math.max(8, Math.min(geom.width, geom.height) * 0.04);
    return { curve: nextCurve, tubularSegments, radialSegments, baseRadius };
  };

  const parameters = computeParameters(geometry);

  let curve = parameters.curve;
  let tubularSegments = parameters.tubularSegments;
  let radialSegments = parameters.radialSegments;
  let baseRadius = parameters.baseRadius;

  let coreGeometry = new TubeGeometry(curve, tubularSegments, baseRadius, radialSegments, false);
  let haloGeometry = new TubeGeometry(curve, tubularSegments, baseRadius * 1.55, radialSegments, false);

  const coreMaterial = new MeshPhysicalMaterial({
    color: new Color("#38bdf8"),
    emissive: new Color("#0ea5e9"),
    emissiveIntensity: 1.6,
    roughness: 0.18,
    metalness: 0.7,
    clearcoat: 0.6,
    clearcoatRoughness: 0.15,
    transmission: 0.28,
    thickness: 18,
    transparent: true,
    opacity: 0.92,
  });

  const haloMaterial = new MeshPhysicalMaterial({
    color: new Color("#bae6fd"),
    emissive: new Color("#38bdf8"),
    emissiveIntensity: 2.8,
    transparent: true,
    opacity: 0.32,
    depthWrite: false,
    blending: AdditiveBlending,
  });

  let pulseGeometry = new SphereGeometry(baseRadius * 1.45, 32, 32);
  const pulsePalette = ["#22d3ee", "#34d399", "#f472b6"];
  const pulseMaterials = pulsePalette.map((hex) => {
    return new MeshPhysicalMaterial({
      color: new Color(hex),
      emissive: new Color(hex),
      emissiveIntensity: 4.2,
      transparent: true,
      opacity: 0.85,
      roughness: 0.18,
      metalness: 0.3,
    });
  });

  const coreMesh = new Mesh(coreGeometry, coreMaterial);
  const haloMesh = new Mesh(haloGeometry, haloMaterial);
  haloMesh.renderOrder = -1;

  const pulseMeshes = pulseMaterials.map((material, index) => {
    const mesh = new Mesh(pulseGeometry, material);
    mesh.scale.setScalar(0.75 + index * 0.1);
    scene.add(mesh);
    return mesh;
  });

  const ambient = new AmbientLight(0xffffff, 0.35);
  const sourceLight = new PointLight(0x38bdf8, 2.4, 1900);
  const firstPoint = geometry.localPoints[0];
  const lastPoint = geometry.localPoints[geometry.localPoints.length - 1];
  sourceLight.position.set(firstPoint.x, firstPoint.y, 140);
  const targetLight = new PointLight(0xf472b6, 3, 1900);
  targetLight.position.set(lastPoint.x, lastPoint.y, 140);
  const midLight = new PointLight(0x22d3ee, 1.8, 1600);
  midLight.position.set(0, 0, 260);

  scene.add(coreMesh);
  scene.add(haloMesh);
  scene.add(ambient);
  scene.add(sourceLight);
  scene.add(targetLight);
  scene.add(midLight);

  const stateRef = {
    geometry,
    curve,
    baseRadius,
    tubularSegments,
    radialSegments,
    cameraOrbitBaseX: geometry.width * 0.05 + 90,
    cameraOrbitBaseY: geometry.height * 0.045 + 70,
    pulseOrbitBase: baseRadius * 3,
  };

  const tempPoint = new Vector3();
  const tempTangent = new Vector3();
  const tempNormal = new Vector3();
  const tempBinormal = new Vector3();
  const tempOffset = new Vector3();
  const tempSecondary = new Vector3();

  const animate = (timestamp: number) => {
    const seconds = timestamp * 0.001;
    const { emissiveBoost, glowBoost, speed, depthShift } = PHASE_SETTINGS[phaseRef.current];
    const wave = (Math.sin(seconds * speed * 2.1) + 1) * 0.5;
    const innerWave = (Math.sin(seconds * speed * 1.2 + Math.PI / 3) + 1) * 0.5;

    coreMaterial.emissiveIntensity = 1.6 + wave * emissiveBoost;
    coreMaterial.thickness = 18 + wave * 12;
    coreMaterial.opacity = 0.88 + wave * 0.06;
    haloMaterial.opacity = 0.24 + innerWave * glowBoost;
    haloMaterial.emissiveIntensity = 2.4 + glowBoost * 1.3 + wave * 1.2;

    const wobble = Math.sin(seconds * 0.45) * 0.18;
    coreMesh.rotation.z = wobble;
    haloMesh.rotation.z = wobble * 1.35;
    scene.rotation.y = Math.sin(seconds * 0.22) * 0.12;

    const orbitPhase = seconds * 0.2;
    camera.position.x = Math.sin(orbitPhase) * stateRef.cameraOrbitBaseX;
    camera.position.y = Math.cos(orbitPhase) * stateRef.cameraOrbitBaseY;
    camera.position.z = 520 + innerWave * depthShift;
    camera.lookAt(0, 0, 0);

    sourceLight.intensity = 2.1 + wave * 0.9;
    sourceLight.position.z = 160 + Math.sin(seconds * speed + 1.2) * 60;
    targetLight.intensity = 2.8 + innerWave * 1;
    targetLight.position.z = 160 + Math.cos(seconds * speed + 2.2) * 60;
    midLight.intensity = 1.4 + wave * 1.1;

    pulseMeshes.forEach((mesh, index) => {
      const travel = (seconds * (0.08 + speed * 0.06) + index * 0.28) % 1;
      stateRef.curve.getPointAt(travel, tempPoint);
      stateRef.curve.getTangentAt(travel, tempTangent).normalize();

      tempNormal.crossVectors(UP_AXIS, tempTangent);
      if (tempNormal.lengthSq() < 1e-6) {
        tempNormal.set(1, 0, 0);
      } else {
        tempNormal.normalize();
      }
      tempBinormal.crossVectors(tempTangent, tempNormal).normalize();

      const orbitAngle = seconds * (0.9 + index * 0.35);
      const orbitRadius = stateRef.pulseOrbitBase + Math.sin(seconds * 1.1 + index) * stateRef.baseRadius * 0.8;

      tempOffset.copy(tempNormal).multiplyScalar(Math.cos(orbitAngle) * orbitRadius);
      tempSecondary.copy(tempBinormal).multiplyScalar(Math.sin(orbitAngle) * orbitRadius * 0.7);
      tempOffset.add(tempSecondary);

      mesh.position.copy(tempPoint).add(tempOffset);
      const scale = 0.9 + Math.sin(seconds * 1.8 + index * 1.4) * 0.25;
      mesh.scale.setScalar(scale);
      const material = pulseMaterials[index];
      material.emissiveIntensity = 4 + wave * 3 + innerWave * 1.5;
      material.opacity = 0.7 + innerWave * 0.2;
    });

    renderer.render(scene, camera);
    bundle.frameId = renderer.getContext() ? requestAnimationFrame(animate) : null;
  };

  const bundle: SceneBundle = {
    renderer,
    scene,
    camera,
    coreMesh,
    haloMesh,
    curve,
    pulseGeometry,
    pulseMeshes,
    pulseMaterials,
    frameId: requestAnimationFrame(animate),
    dispose: () => {
      if (bundle.frameId !== null) {
        cancelAnimationFrame(bundle.frameId);
        bundle.frameId = null;
      }
      pulseMeshes.forEach((mesh) => {
        scene.remove(mesh);
      });
      coreMesh.geometry.dispose();
      haloMesh.geometry.dispose();
      pulseGeometry.dispose();
      pulseMaterials.forEach((material) => material.dispose());
      coreMaterial.dispose();
      haloMaterial.dispose();
      renderer.dispose();
    },
    updateGeometry: (nextGeometry: GeometryData) => {
      stateRef.geometry = nextGeometry;

      const params = computeParameters(nextGeometry);
      stateRef.curve = params.curve;
      stateRef.baseRadius = params.baseRadius;
      stateRef.tubularSegments = params.tubularSegments;
      stateRef.radialSegments = params.radialSegments;
      curve = params.curve;
      tubularSegments = params.tubularSegments;
      radialSegments = params.radialSegments;
      baseRadius = params.baseRadius;
      stateRef.cameraOrbitBaseX = nextGeometry.width * 0.05 + 90;
      stateRef.cameraOrbitBaseY = nextGeometry.height * 0.045 + 70;
      stateRef.pulseOrbitBase = params.baseRadius * 3;

      renderer.setSize(nextGeometry.width, nextGeometry.height, false);

      const newCoreGeometry = new TubeGeometry(
        params.curve,
        params.tubularSegments,
        params.baseRadius,
        params.radialSegments,
        false,
      );
      coreMesh.geometry.dispose();
      coreMesh.geometry = newCoreGeometry;
      coreGeometry = newCoreGeometry;

      const newHaloGeometry = new TubeGeometry(
        params.curve,
        params.tubularSegments,
        params.baseRadius * 1.55,
        params.radialSegments,
        false,
      );
      haloMesh.geometry.dispose();
      haloMesh.geometry = newHaloGeometry;
      haloGeometry = newHaloGeometry;

      const previousPulseGeometry = pulseGeometry;
      pulseGeometry = new SphereGeometry(params.baseRadius * 1.45, 32, 32);
      pulseMeshes.forEach((mesh, index) => {
        mesh.geometry = pulseGeometry;
        mesh.scale.setScalar(0.75 + index * 0.1);
      });
      previousPulseGeometry.dispose();

      bundle.curve = curve;
      bundle.pulseGeometry = pulseGeometry;

      const first = nextGeometry.localPoints[0];
      const last = nextGeometry.localPoints[nextGeometry.localPoints.length - 1];
      sourceLight.position.set(first.x, first.y, 140);
      targetLight.position.set(last.x, last.y, 140);
    },
  };

  return bundle;
};

export const bezierConnectionRenderer = (
  context: ConnectionRenderContext,
  defaultRender: () => React.ReactElement,
): React.ReactElement => {
  const defaultElement = defaultRender();
  const hitElement = React.isValidElement(defaultElement) ? <g style={{ opacity: 0 }}>{defaultElement}</g> : defaultElement;

  const { fromPort, toPort, fromPosition, toPosition, isSelected, isHovered, handlers, phase } = context;
  const targetPortPosition = toPort?.position ?? getOppositePortPosition(fromPort.position);
  const { cp1, cp2 } = React.useMemo(
    () => calculateBezierControlPoints(fromPosition, toPosition, fromPort.position, targetPortPosition),
    [
      fromPosition.x,
      fromPosition.y,
      toPosition.x,
      toPosition.y,
      fromPort.position,
      targetPortPosition,
    ],
  );

  const geometry = React.useMemo(
    () =>
      getGeometryData(
        fromPosition,
        toPosition,
        cp1,
        cp2,
        fromPort.position,
        toPort?.position ?? getOppositePortPosition(fromPort.position),
      ),
    [
      fromPosition.x,
      fromPosition.y,
      toPosition.x,
      toPosition.y,
      cp1.x,
      cp1.y,
      cp2.x,
      cp2.y,
      fromPort.position,
      toPort?.position,
    ],
  );

  const animationPhase: AnimationPhase = React.useMemo(() => {
    if (phase === "disconnecting" || isSelected) {
      return "selected";
    }
    if (phase === "connecting" || isHovered) {
      return "hovered";
    }
    return "idle";
  }, [phase, isHovered, isSelected]);

const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const phaseRef = React.useRef<AnimationPhase>(animationPhase);
  const bundleRef = React.useRef<SceneBundle | null>(null);

  React.useEffect(() => {
    phaseRef.current = animationPhase;
  }, [animationPhase]);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return () => undefined;
    }

    bundleRef.current = createBundle(canvas, geometry, phaseRef);

    return () => {
      bundleRef.current?.dispose();
      bundleRef.current = null;
    };
  }, []);

  React.useEffect(() => {
    bundleRef.current?.updateGeometry(geometry);
  }, [geometry.key]);

  return (
    <g>
      <path
        d={geometry.pathData}
        className={styles.connectorFallback}
        onPointerDown={handlers.onPointerDown}
        onPointerEnter={handlers.onPointerEnter}
        onPointerLeave={handlers.onPointerLeave}
        onContextMenu={handlers.onContextMenu}
      />
      <foreignObject x={geometry.originX} y={geometry.originY} width={geometry.width} height={geometry.height}>
        <div className={styles.canvasHost}>
          <canvas ref={canvasRef} className={styles.connectorCanvas} width={geometry.width} height={geometry.height} />
        </div>
      </foreignObject>
      {hitElement}
    </g>
  );
};
