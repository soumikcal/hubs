import { CAMERA_MODE_FIRST_PERSON } from "../systems/camera-system";
import { setMatrixWorld } from "../utils/three-utils";
const TWOPI = Math.PI * 2;
function deltaAngle(a, b) {
  const p = Math.abs(b - a) % TWOPI;
  return p > Math.PI ? TWOPI - p : p;
}

const getDesiredTransform = (() => {
  const p1 = new THREE.Vector3();
  const q1 = new THREE.Quaternion();
  const s1 = new THREE.Vector3();

  const p2 = new THREE.Vector3();
  const q2 = new THREE.Quaternion();
  const s2 = new THREE.Vector3();

  const p3 = new THREE.Vector3();
  const q3 = new THREE.Quaternion();
  const s3 = new THREE.Vector3();

  const v1 = new THREE.Vector3();
  const v2 = new THREE.Vector3();
  const v3 = new THREE.Vector3();

  const m = new THREE.Matrix4();
  const m2 = new THREE.Matrix4();

  const UP = new THREE.Vector3(0, 1, 0);
  const DOWN = new THREE.Vector3(0, -1, 0);

  const CUTOFF = Math.cos(Math.PI / 4);

  return function getDesiredTransform(head, hud) {
    head.updateMatrices();
    head.matrixWorld.decompose(p1, q1, s1);

    hud.updateMatrices();
    hud.matrixWorld.decompose(p2, q2, s2);

    // Calculate current direction
    p1.y = 0;
    p2.y = 0;
    v1.subVectors(p2, p1).normalize();

    // Calculate look direction
    v2.set(0, 0, -1).applyQuaternion(q1);
    v2.y = 0;
    v2.normalize();

    // Lerp towards look dir
    v3.lerpVectors(v1, v2, 0.1).normalize();

    // Compose the matrix appropriately
    // Decompose again to get p1 back. (Yes, this is a silly / expensive thing to do.)
    head.matrixWorld.decompose(p1, q1, s1);
    v3.multiplyScalar(1); // How far in front of you
    p3.addVectors(p1, v3);
    p3.y = p3.y - 1.4; // How far below you.

    m.identity().lookAt(p1, p3, UP);
    q3.setFromRotationMatrix(m);

    s3.setScalar(0.5); // How big?

    // If the look direction isn't downward enough, hide the menu.
    v2.set(0, 0, -1).applyQuaternion(q1);
    if (v2.dot(DOWN) < CUTOFF) {
      p3.y = p3.y - 1000;
    }

    m2.compose(p3, q3, s3);

    return m2;
  };
})();

/**
 * Positions the HUD and toggles app mode based on where the user is looking
 * @namespace ui
 * @component hud-controller
 */
AFRAME.registerComponent("hud-controller", {
  schema: {
    head: { type: "selector" },
    offset: { default: 0.7 }, // distance from hud above head,
    lookCutoff: { default: 20 }, // angle at which the hud should be "on",
    animRange: { default: 30 }, // degrees over which to animate the hud into view
    yawCutoff: { default: 50 } // yaw degrees at wich the hud should reoirent even if the user is looking up
  },
  init() {
    this.onChildHovered = this.onChildHovered.bind(this);
    this.removeHoverEvents = this.removeHoverEvents.bind(this);
    this.isYLocked = false;
    this.lockedHeadPositionY = 0;
    this.lookDir = new THREE.Vector3();
    this.lookEuler = new THREE.Euler();
    this.store = window.APP.store;
    this.hoverableChildren = this.el.querySelectorAll("[is-remote-hover-target]");
  },

  tick() {
    const hud = this.el.object3D;
    const head = this.data.head.object3DMap.camera;

    setMatrixWorld(hud, getDesiredTransform(head, hud));
  },

  play() {
    for (let i = 0; i < this.hoverableChildren.length; i++) {
      this.hoverableChildren[i].object3D.addEventListener("hovered", this.onChildHovered);
    }
  },

  pause() {
    this.removeHoverEvents();
  },

  removeHoverEvents() {
    for (let i = 0; i < this.hoverableChildren.length; i++) {
      this.hoverableChildren[i].object3D.removeEventListener("hovered", this.onChildHovered);
    }
  },

  onChildHovered() {
    if (!this.store.state.activity.hasHoveredInWorldHud) {
      this.store.update({ activity: { hasHoveredInWorldHud: true } });
      this.removeHoverEvents();
    }
  }
});
