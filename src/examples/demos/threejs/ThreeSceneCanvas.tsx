/**
 * @file Three.js canvas that renders a rotating teapot preview.
 */
import * as React from "react";
import {
  AmbientLight,
  Color,
  DirectionalLight,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  Scene,
  Vector3,
  WebGLRenderer,
} from "three";
import { TeapotGeometry } from "three/examples/jsm/geometries/TeapotGeometry.js";

/**
 * Encapsulated Three.js scene with rotating geometry.
 * Updates mesh color and scale reactively based on props.
 */
export type ThreeSceneCanvasProps = {
  color: string;
  scale: number;
};

type SceneRefs = {
  renderer: WebGLRenderer;
  mesh: Mesh;
  material: MeshStandardMaterial;
  camera: PerspectiveCamera;
  scene: Scene;
};

const MIN_SCALE = 0.1;
const MAX_SCALE = 8;
const TEAPOT_SIZE = 0.7;
const TEAPOT_SEGMENTS = 14;

export const ThreeSceneCanvas: React.FC<ThreeSceneCanvasProps> = ({ color, scale }) => {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const animationFrameRef = React.useRef<number | null>(null);
  const sceneRef = React.useRef<SceneRefs | null>(null);

  React.useEffect(() => {
    const host = containerRef.current;
    if (!host) {
      return;
    }

    const renderer = new WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(host.clientWidth, host.clientHeight);
    host.appendChild(renderer.domElement);

    const scene = new Scene();
    scene.background = new Color(0x0f172a);

    const camera = new PerspectiveCamera(45, host.clientWidth / host.clientHeight, 0.1, 100);
    camera.position.set(0, 1.6, 4.5);
    camera.lookAt(new Vector3(0, 0, 0));

    const geometry = new TeapotGeometry(TEAPOT_SIZE, TEAPOT_SEGMENTS, true, true, true, false, true);
    geometry.center();
    const material = new MeshStandardMaterial({ color: new Color(color) });
    const mesh = new Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);

    const ambientLight = new AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const keyLight = new DirectionalLight(0xffffff, 0.9);
    keyLight.position.set(3, 4, 5);
    keyLight.lookAt(new Vector3(0, 0, 0));
    scene.add(keyLight);

    const fillLight = new DirectionalLight(0x60a5fa, 0.4);
    fillLight.position.set(-2.5, -1.5, -3.5);
    scene.add(fillLight);

    const renderScene = () => {
      mesh.rotation.y += 0.01;
      mesh.rotation.x += 0.005;
      renderer.render(scene, camera);
      animationFrameRef.current = requestAnimationFrame(renderScene);
    };
    renderScene();

    const handleResize = () => {
      if (!sceneRef.current) {
        return;
      }
      const { renderer: activeRenderer, camera: activeCamera } = sceneRef.current;
      const width = host.clientWidth;
      const height = host.clientHeight || 1;
      activeRenderer.setSize(width, height);
      activeCamera.aspect = width / height;
      activeCamera.updateProjectionMatrix();
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(host);
    window.addEventListener("resize", handleResize);

    sceneRef.current = { renderer, mesh, material, camera, scene };

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      resizeObserver.disconnect();
      window.removeEventListener("resize", handleResize);

      renderer.dispose();
      geometry.dispose();
      material.dispose();

      host.removeChild(renderer.domElement);
      scene.clear();
      sceneRef.current = null;
    };
  }, []);

  React.useEffect(() => {
    if (!sceneRef.current) {
      return;
    }

    const { material } = sceneRef.current;
    try {
      material.color = new Color(color);
    } catch {
      material.color = new Color(0xffffff);
    }
  }, [color]);

  React.useEffect(() => {
    if (!sceneRef.current) {
      return;
    }

    const { mesh } = sceneRef.current;
    const clampedScale = Math.min(Math.max(scale, MIN_SCALE), MAX_SCALE);
    mesh.scale.set(clampedScale, clampedScale, clampedScale);
  }, [scale]);

  return <div ref={containerRef} style={{ width: "100%", height: "100%" }} />;
};
