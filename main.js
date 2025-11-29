import * as THREE from "https://unpkg.com/three@0.164.0/build/three.module.js";

const canvas = document.getElementById("bg");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

const uniforms = {
  uTime: { value: 0 },
  uResolution: {
    value: new value THREE.Vector2(window.innerWidth, window.innerHeight),
  },
};

const material = new THREE.ShaderMaterial({
  uniforms,
  vertexShader: `
    void main() {
      gl_Position = vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    precision highp float;

    uniform float uTime;
    uniform vec2 uResolution;

    // ---- simple pseudo-noise ----
    float hash(vec2 p) {
      p = fract(p * vec2(123.34, 456.21));
      p += dot(p, p + 45.32);
      return fract(p.x * p.y);
    }

    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);

      float a = hash(i);
      float b = hash(i + vec2(1.0, 0.0));
      float c = hash(i + vec2(0.0, 1.0));
      float d = hash(i + vec2(1.0, 1.0));

      vec2 u = f * f * (3.0 - 2.0 * f);

      return mix(a, b, u.x) +
             (c - a) * u.y * (1.0 - u.x) +
             (d - b) * u.x * u.y;
    }

    float fbm(vec2 p) {
      float v = 0.0;
      float a = 0.5;
      for (int i = 0; i < 5; i++) {
        v += a * noise(p);
        p *= 2.0;
        a *= 0.5;
      }
      return v;
    }

    void main() {
      vec2 uv = gl_FragCoord.xy / uResolution.xy;
      uv.x *= uResolution.x / uResolution.y; // keep aspect

      // center the field around the text area
      vec2 p = uv - vec2(0.5, 0.5);

      // animate
      float t = uTime * 0.08;
      float n1 = fbm(p * 2.5 + t);
      float n2 = fbm(p * 4.5 - t * 1.2);

      float glow = smoothstep(0.0, 0.8, 0.4 + n1 + n2);

      // directional light towards right
      float vignette = 1.0 - smoothstep(0.5, 1.0, length(p * vec2(1.0, 0.7)));
      float sideLight = smoothstep(0.0, 1.0, uv.x * 1.4);

      // base colors
      vec3 purple = vec3(0.45, 0.25, 0.8);
      vec3 blue   = vec3(0.4, 0.6, 1.0);
      vec3 white  = vec3(1.0);

      vec3 col = mix(purple, blue, uv.x + n1 * 0.2);
      col = mix(col, white, sideLight * 0.9);

      col *= glow * vignette;

      // add soft fog
      col += vec3(0.02, 0.01, 0.03);

      // final gamma-ish
      col = pow(col, vec3(0.9));

      gl_FragColor = vec4(col, 1.0);
    }
  `,
});

const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
scene.add(quad);

function onResize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  renderer.setSize(w, h, false);
  uniforms.uResolution.value.set(w, h);
}
window.addEventListener("resize", onResize);
onResize();

const clock = new THREE.Clock();

function animate() {
  uniforms.uTime.value = clock.getElapsedTime();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
animate();
