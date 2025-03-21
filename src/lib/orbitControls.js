/**
 * This is a workaround for Three.js OrbitControls in Next.js
 * We're importing from 'three/examples/jsm/controls/OrbitControls.js' directly
 * and re-exporting it
 */
import { OrbitControls as ThreeOrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export const OrbitControls = ThreeOrbitControls; 