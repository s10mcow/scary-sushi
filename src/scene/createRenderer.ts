import {
  ACESFilmicToneMapping,
  PCFSoftShadowMap,
  SRGBColorSpace,
  WebGLRenderer,
} from 'three';

export function createRenderer(host: HTMLElement): WebGLRenderer {
  const renderer = new WebGLRenderer({ antialias: false, powerPreference: 'high-performance', preserveDrawingBuffer: true });
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.shadowMap.enabled = false;
  renderer.shadowMap.type = PCFSoftShadowMap;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.1));
  renderer.setSize(1, 1, false);
  host.appendChild(renderer.domElement);

  return renderer;
}
