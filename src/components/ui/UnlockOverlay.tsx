import { useEffect, useState } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { t } from '../../utils/i18n';
import { isDemoMode, redeemLicense } from '../../utils/license';
import { track } from '../../utils/analytics';

const AFDIAN_URL = 'https://afdian.com/item/170b3b9caced11f197865254001e7c00';

/**
 * Monetization gate — in demo mode, once the player restores power (objective 4)
 * the game shows a full-version wall. Redeem a license code or buy on 爱发电.
 */
export function UnlockOverlay() {
  const gameState = useGameStore((s) => s.gameState);
  const completed = useGameStore((s) => s.completedObjectives);
  const setGameState = useGameStore((s) => s.setGameState);
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    if (unlocked) return;
    // Re-evaluate when objectives change
    setMsg(null);
    setCode('');
  }, [completed, unlocked]);

  if (unlocked) return null;
  if (!isDemoMode()) return null;
  if (gameState !== 'playing' && gameState !== 'paused') return null;
  if (!completed.includes('restore_power')) return null;

  const submit = () => {
    if (redeemLicense(code)) {
      track('unlock', { mode: 'license' });
      setMsg(t('unlock_success'));
      setUnlocked(true);
      setTimeout(() => setUnlocked(false), 1200);
    } else {
      setMsg(t('unlock_invalid'));
    }
  };

  return (
    <div className="unlock-overlay">
      <div className="unlock-card">
        <h2>🔒 {t('unlock_title')}</h2>
        <p className="unlock-desc">{t('unlock_desc')}</p>
        <p className="unlock-features">{t('unlock_features')}</p>

        <div className="unlock-code-row">
          <input
            className="unlock-input"
            placeholder="DZ-XXXX-XXXX-XXXX"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
          />
          <button className="menu-btn" onClick={submit}>{t('unlock_btn')}</button>
        </div>
        {msg && <p className={unlocked ? 'unlock-msg ok' : 'unlock-msg bad'}>{msg}</p>}

        <a className="menu-btn unlock-buy" href={AFDIAN_URL} target="_blank" rel="noreferrer">
          🛒 {t('unlock_buy')}
        </a>
        <button className="menu-btn unlock-back" onClick={() => setGameState('menu')}>
          {t('menu_back')}
        </button>
      </div>
    </div>
  );
}
