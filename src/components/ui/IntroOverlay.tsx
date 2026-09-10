import { useEffect, useState } from 'react';
import { t } from '../../utils/i18n';

const INTRO_KEY = 'dz_intro_done_v1';

/** First-run controls tutorial overlay (shown once, skipped in ?debug=1). */
export function IntroOverlay({ onClose }: { onClose?: () => void }) {
  const [show, setShow] = useState(false);

  const close = () => {
    setShow(false);
    onClose?.();
  };

  useEffect(() => {
    const isDebug = new URLSearchParams(window.location.search).has('debug');
    if (isDebug) return;
    if (sessionStorage.getItem(INTRO_KEY)) return;
    sessionStorage.setItem(INTRO_KEY, '1');
    const timer = setTimeout(() => setShow(true), 700);
    return () => clearTimeout(timer);
  }, []);

  if (!show) return null;

  return (
    <div className="intro-overlay" onClick={close}>
      <div className="intro-card">
        <h2>{t('intro_title')}</h2>
        <ul className="intro-list">
          <li><b>W A S D</b> — {t('intro_move')}</li>
          <li><b>🖱 {t('intro_look')}</b> — {t('intro_look_desc')}</li>
          <li><b>E</b> — {t('intro_interact')}</li>
          <li><b>{t('intro_fire')}</b> — {t('intro_fire_desc')}</li>
          <li><b>F</b> — {t('intro_flashlight')}</li>
          <li><b>1-4 / Q</b> — {t('intro_weapons')}</li>
          <li><b>Shift</b> — {t('intro_sprint')} · <b>Space</b> — {t('intro_jump')} · <b>Esc</b> — {t('intro_pause')}</li>
        </ul>
        <p className="intro-tip">{t('intro_tip')}</p>
        <button className="menu-btn" onClick={close}>{t('intro_start')}</button>
      </div>
    </div>
  );
}
