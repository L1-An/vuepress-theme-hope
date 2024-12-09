import type { Mesh } from "three";
import type { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import type { VNode } from "vue";
import { computed, defineComponent, h, onMounted, ref, watch } from "vue";

import { useWindowSize } from "@theme-hope/composables/index";
import { useDarkmode } from "@theme-hope/modules/outlook/composables/index";

import "../styles/hope-logo.scss";

const ASSETS_SERVER = "https://theme-hope-assets.vuejs.press";

export default defineComponent({
  name: "HopeLogo",

  setup() {
    const { isDarkmode } = useDarkmode();
    const { isMobile } = useWindowSize();

    const ready = ref(false);

    const sizes = computed(() =>
      isMobile.value
        ? { width: 220, height: 220 }
        : { width: 300, height: 300 },
    );

    const renderLogo = async (
      // eslint-disable-next-line @typescript-eslint/consistent-type-imports
      three: typeof import("three"),
      STLLoaderConstructor: typeof STLLoader,
      OrbitControlsConstructor: typeof OrbitControls,
    ): Promise<void> => {
      const { width, height } = sizes.value;

      // Canvas
      const canvas =
        document.querySelector<HTMLCanvasElement>("canvas#hero-logo")!;
      // Scene
      const scene = new three.Scene();
      const stlLoader = new STLLoaderConstructor();
      const textureLoader = new three.TextureLoader();
      const roughnessTexture = textureLoader.load(
        `${ASSETS_SERVER}/model/roughness.jpeg`,
      );
      // Models
      let logo1: Mesh;
      let logo2: Mesh;

      // Lights
      const ambientLight = new three.AmbientLight(
        0xffffff,
        isDarkmode.value ? 5 : 15,
      );
      const directionalLight = new three.DirectionalLight(0xffffff, 3);
      const directionalLight2 = new three.DirectionalLight(0xffffff, 3);

      directionalLight.position.set(3, 3, 3);
      directionalLight2.position.set(-3, -3, -3);

      scene.add(ambientLight);
      scene.add(directionalLight);
      scene.add(directionalLight2);

      // Base camera
      const camera = new three.PerspectiveCamera(45, width / height, 1, 2000);

      camera.position.set(0, 0, 20);
      scene.add(camera);

      // Controls
      const controls = new OrbitControlsConstructor(camera, canvas);

      controls.enableZoom = false;
      controls.target.set(0, 0.75, 0);
      controls.enableDamping = true;
      controls.enablePan = false;
      // Lock Y Axis
      controls.minPolarAngle = Math.PI / 2;
      controls.maxPolarAngle = Math.PI / 2;

      // Render
      const renderer = new three.WebGLRenderer({
        alpha: true,
        antialias: true,
        canvas,
      });

      renderer.setClearColor(0x000000, 0);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = three.PCFSoftShadowMap;
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

      await Promise.all([
        new Promise<void>((resolve) => {
          stlLoader.load(`${ASSETS_SERVER}/model/logo1.stl`, (geometry) => {
            const material = new three.MeshPhysicalMaterial({
              color: 0x284c39,
              metalness: 0.3,
              roughness: 0.5,
              roughnessMap: roughnessTexture,
              displacementScale: 0.15,
              emissiveIntensity: 0.4,
              reflectivity: 1,
            });

            logo1 = new three.Mesh(geometry, material);
            logo1.castShadow = true;
            logo1.receiveShadow = true;
            logo1.rotation.z = 0;
            logo1.scale.set(0.3, 0.3, 0.3);

            scene.add(logo1);

            resolve();
          });
        }),
        new Promise<void>((resolve) => {
          stlLoader.load(`${ASSETS_SERVER}/model/logo2.stl`, (geometry) => {
            const material = new three.MeshPhysicalMaterial({
              color: 0x35495e,
              metalness: 0.7,
              roughness: 0.5,
              roughnessMap: roughnessTexture,
              displacementScale: 0.15,
              emissiveIntensity: 0.4,
              reflectivity: 1,
            });

            logo2 = new three.Mesh(geometry, material);
            logo2.castShadow = true;
            logo2.receiveShadow = true;
            logo2.rotation.z = 0;
            logo2.scale.set(0.3, 0.3, 0.3);

            scene.add(logo2);

            resolve();
          });
        }),
      ]);

      // Animations
      const clock = new three.Clock();

      const tick = (): void => {
        const elapsedTime = clock.getElapsedTime();

        logo1.rotation.y = 0.5 * elapsedTime;
        logo2.rotation.y = 0.5 * elapsedTime;

        // Update controls
        controls.update();
        // Render
        renderer.render(scene, camera);
        // Call tick again on the next frame
        window.requestAnimationFrame(tick);
      };

      tick();

      ready.value = true;
    };

    onMounted(() => {
      watch(
        [isDarkmode, isMobile],
        () =>
          Promise.all([
            import(/* webpackChunkName: "hope-logo" */ "three").then((m) => m),
            import(
              /* webpackChunkName: "hope-logo" */ "three/examples/jsm/controls/OrbitControls.js"
            ).then((m) => m),
            import(
              /* webpackChunkName: "hope-logo" */ "three/examples/jsm/loaders/STLLoader.js"
            ).then((m) => m),
          ]).then(([THREE, { OrbitControls }, { STLLoader }]) =>
            renderLogo(THREE, STLLoader, OrbitControls),
          ),
        { immediate: true },
      );
    });

    return (): (VNode | null)[] => [
      ready.value
        ? null
        : h("img", {
            class: "vp-hero-image",
            src: `${ASSETS_SERVER}/logo.svg`,
            alt: "vuepress-theme-hope",
          }),

      h("canvas", {
        id: "hero-logo",
        style: {
          display: ready.value ? "block" : "none",
          opacity: ready.value ? 1 : 0,
        },
      }),
    ];
  },
});
