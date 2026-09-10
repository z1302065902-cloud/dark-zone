import { useRef, useState } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { isTouchDevice } from '../../utils/touch';
import { t } from '../../utils/i18n';

/**
 * Mobile touch controls — only rendered on touch devices while playing.
 * Movement is injected as synthetic keyboard events (WASD), look via the
 * `dz:touch-look` window event (read by Player), fire via the existing
 * `dz:fire-weapon` bridge (read by WeaponSystem). Zero changes to gameplay code.
 */
export function TouchControls() {
  const gameState = useGameStore((s) => s.gameState);
  const [, force] = useState(0);

  const joy = useRef<{ id: number; baseX: number; baseY: number } | null>(null);
  const joyPos = useRef({ x: 0, z: 0 });

  if (!isTouchDevice() || gameState !== 'playing') return null;

  const key = (code: string, down: boolean) =>
    window.dispatchEvent(new KeyboardEvent(down ? 'keydown' : 'keyup', { code, bubbles: true }));

  const applyJoy = (dx: number, dy: number) => {
    // Normalize to [-1, 1] with dead zone
    let x = dx / 48;
    let z = dy / 48; // screen y up = forward
    const len = Math.hypot(x, z);
    if (len > 1) { x /= len; z /= len; }
    const dead = 0.22;
    key('KeyW', z < -dead);
    key('KeyS', z > dead);
    key('KeyA', x < -dead);
    key('KeyD', x > dead);
    if (Math.abs(z) > 0.6) key('ShiftLeft', true); else key('ShiftLeft', false);
    joyPos.current = { x, z };
    force((n) => n + 1);
  };

  const joystickDown = (e: React.PointerEvent) => {
    e.preventDefault();
    if (joy.current) return;
    joy.current = { id: e.pointerId, baseX: e.clientX, baseY: e.clientY };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    applyJoy(0, 0);
  };
  const joystickMove = (e: React.PointerEvent) => {
    if (!joy.current || e.pointerId !== joy.current.id) return;
    e.preventDefault();
    applyJoy(e.clientX - joy.current.baseX, e.clientY - joy.current.baseY);
  };
  const joystickUp = (e: React.PointerEvent) => {
    if (!joy.current || e.pointerId !== joy.current.id) return;
    joy.current = null;
    applyJoy(0, 0);
    key('ShiftLeft', false);
  };

  const lookRef = useRef<{ id: number; lastX: number; lastY: number } | null>(null);
  const lookDown = (e: React.PointerEvent) => {
    e.preventDefault();
    if (lookRef.current) return;
    lookRef.current = { id: e.pointerId, lastX: e.clientX, lastY: e.clientY };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const lookMove = (e: React.PointerEvent) => {
    const l = lookRef.current;
    if (!l || e.pointerId !== l.id) return;
    e.preventDefault();
    const dx = e.clientX - l.lastX;
    const dy = e.clientY - l.lastY;
    l.lastX = e.clientX;
    l.lastY = e.clientY;
    window.dispatchEvent(new CustomEvent('dz:touch-look', { detail: { rx: dy * 0.004, ry: dx * 0.004 } }));
  };
  const lookUp = (e: React.PointerEvent) => {
    if (lookRef.current && e.pointerId === lookRef.current.id) lookRef.current = null;
  };

  const pressE = (e: React.PointerEvent) => {
    e.preventDefault();
    key('KeyE', true);
    setTimeout(() => key('KeyE', false), 80);
  };
  const pressFire = (e: React.PointerEvent) => {
    e.preventDefault();
    window.dispatchEvent(new CustomEvent('dz:fire-weapon', {}));
  };
  const pressF = (e: React.PointerEvent) => {
    e.preventDefault();
    key('KeyF', true);
    setTimeout(() => key('KeyF', false), 60);
  };
  const pressWeapon = (code: string) => (e: React.PointerEvent) => {
    e.preventDefault();
    key(code, true);
    setTimeout(() => key(code, false), 60);
  };

  const kx = joyPos.current.x;
  const kz = joyPos.current.z;

  return (
    <div className="touch-controls">
      {/* Left: virtual joystick */}
      <div
        className="touch-zone touch-zone-left"
        onPointerDown={joystickDown}
        onPointerMove={joystickMove}
        onPointerUp={joystickUp}
        onPointerCancel={joystickUp}
        onContextMenu={(e) => e.preventDefault()}
      >
        <div className="joy-base">
          <div
            className="joy-knob"
            style={{ transform: `translate(${kx * 48}px, ${kz * 48}px)` }}
          />
        </div>
      </div>

      {/* Right: look drag zone */}
      <div
        className="touch-zone touch-zone-right"
        onPointerDown={lookDown}
        onPointerMove={lookMove}
        onPointerUp={lookUp}
        onPointerCancel={lookUp}
        onContextMenu={(e) => e.preventDefault()}
      />

      {/* Right edge: action buttons */}
      <div className="touch-buttons">
        <button className="touch-btn" onPointerDown={pressE}>{t('touch_interact')}</button>
        <button className="touch-btn touch-btn-fire" onPointerDown={pressFire}>{t('touch_fire')}</button>
        <button className="touch-btn" onPointerDown={pressWeapon('Digit1')}>1</button>
        <button className="touch-btn" onPointerDown={pressWeapon('Digit2')}>2</button>
        <button className="touch-btn" onPointerDown={pressWeapon('Digit3')}>3</button>
        <button className="touch-btn" onPointerDown={pressF}>{t('touch_flashlight')}</button>
      </div>
    </div>
  );
}
