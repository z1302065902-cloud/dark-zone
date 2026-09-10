import { useEffect, useMemo, useRef } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { t } from '../../utils/i18n';

interface Objective {
  id: string;
  title: string;
  description: string;
  type: 'find' | 'activate' | 'survive' | 'kill' | 'escape';
  targetId?: string;
  requiredItems?: string[];
  completed: boolean;
  optional?: boolean;
}

// Hospital 0.1 Objectives
export const HOSPITAL_OBJECTIVES: Objective[] = [
  {
    id: 'find_keycard',
    title: t('obj_find_keycard').title,
    description: t('obj_find_keycard').desc,
    type: 'find',
    targetId: 'keycard',
    completed: false,
  },
  {
    id: 'unlock_emergency',
    title: t('obj_unlock_emergency').title,
    description: t('obj_unlock_emergency').desc,
    type: 'activate',
    targetId: 'door_emergency',
    requiredItems: ['keycard'],
    completed: false,
  },
  {
    id: 'find_fuse',
    title: t('obj_find_fuse').title,
    description: t('obj_find_fuse').desc,
    type: 'find',
    targetId: 'fuse',
    completed: false,
  },
  {
    id: 'insert_fuse',
    title: t('obj_restore_power').title,
    description: t('obj_restore_power').desc,
    type: 'activate',
    targetId: 'fusebox_emergency',
    requiredItems: ['fuse'],
    completed: false,
  },
  {
    id: 'restore_power',
    title: t('obj_door_surgery').title,
    description: t('obj_door_surgery').desc,
    type: 'activate',
    targetId: 'door_surgery',
    completed: false,
  },
  {
    id: 'find_master_key',
    title: t('obj_find_master_key').title,
    description: t('obj_find_master_key').desc,
    type: 'find',
    targetId: 'master_key',
    completed: false,
  },
  {
    id: 'enter_lab',
    title: t('obj_enter_lab').title,
    description: t('obj_enter_lab').desc,
    type: 'activate',
    targetId: 'door_lab',
    requiredItems: ['master_key'],
    completed: false,
  },
  {
    id: 'defeat_boss',
    title: t('obj_defeat_boss').title,
    description: t('obj_defeat_boss').desc,
    type: 'kill',
    targetId: 'nurse07',
    completed: false,
  },
  {
    id: 'escape_hospital',
    title: t('obj_escape_hospital').title,
    description: t('obj_escape_hospital').desc,
    type: 'escape',
    completed: false,
  },
];

export function ObjectiveSystem() {
  const { 
    completedObjectives, 
    completeObjective, 
    hasItem,
    setInteractionPrompt,
    currentLevel 
  } = useGameStore();
  
  // Track current objective index
  const currentIndex = useMemo(() => {
    return HOSPITAL_OBJECTIVES.findIndex(obj => !completedObjectives.includes(obj.id));
  }, [completedObjectives]);
  
  const currentObjective = currentIndex >= 0 ? HOSPITAL_OBJECTIVES[currentIndex] : null;
  
  // Auto-complete objectives based on items/state
  useEffect(() => {
    if (currentLevel !== 'hospital') return;
    
    // Check item-based completions
    HOSPITAL_OBJECTIVES.forEach(obj => {
      if (completedObjectives.includes(obj.id)) return;
      
      if (obj.requiredItems && obj.requiredItems.every(item => hasItem(item))) {
        // Check if we're at the right location (simplified)
        if (obj.type === 'find' && hasItem(obj.targetId || '')) {
          completeObjective(obj.id);
        }
      }
    });
  }, [completedObjectives, hasItem, currentLevel, completeObjective]);
  
  // Expose for other components
  useMemo(() => {
    (window as any).__DZ_OBJECTIVES__ = {
      list: HOSPITAL_OBJECTIVES,
      completed: completedObjectives,
      current: currentObjective,
      complete: completeObjective,
    };
  }, [completedObjectives, currentObjective, completeObjective]);
  
  // Victory: all objectives done → levelcomplete screen
  const victoryShown = useRef(false);
  useEffect(() => {
    if (completedObjectives.includes('escape_hospital') && !victoryShown.current) {
      victoryShown.current = true;
      useGameStore.getState().setGameState('levelcomplete');
    }
  }, [completedObjectives]);
  
  // This component doesn't render anything; it's logic-only
  return null;
}

// Hook for UI components to access objectives
export function useObjectives() {
  const { completedObjectives, completeObjective } = useGameStore();
  
  const getCurrent = () => HOSPITAL_OBJECTIVES.find(obj => !completedObjectives.includes(obj.id)) || null;
  const getProgress = () => {
    const total = HOSPITAL_OBJECTIVES.length;
    const done = HOSPITAL_OBJECTIVES.filter(obj => completedObjectives.includes(obj.id)).length;
    return { done, total, percent: Math.round(done / total * 100) };
  };
  const isComplete = (id: string) => completedObjectives.includes(id);
  const complete = (id: string) => completeObjective(id);
  
  return { objectives: HOSPITAL_OBJECTIVES, getCurrent, getProgress, isComplete, complete };
}

// Objective HUD Component (renders in GameUI)
export function ObjectiveHUD() {
  const { completedObjectives } = useGameStore();
  const current = HOSPITAL_OBJECTIVES.find(obj => !completedObjectives.includes(obj.id));
  const progress = HOSPITAL_OBJECTIVES.filter(obj => completedObjectives.includes(obj.id)).length;
  const total = HOSPITAL_OBJECTIVES.length;

  if (!current) return null;

  // Re-resolve localized text each render so the HUD follows language toggles
  const objKey = `obj_${current.id}`;
  const raw = (t as unknown as (k: string) => { title: string; desc: string })(objKey);
  const title = raw && raw.title ? raw.title : current.title;
  const desc = raw && raw.desc ? raw.desc : current.description;

  return (
    <div className="objective-hud" style={styles.container}>
      <div style={styles.header}>
        <span style={styles.icon}>🎯</span>
        <span style={styles.title}>{t('obj_current')}</span>
        <span style={styles.progress}>{progress}/{total}</span>
      </div>
      <div style={styles.body}>
        <div style={styles.objTitle}>{title}</div>
        <div style={styles.objDesc}>{desc}</div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'fixed',
    top: '120px',
    left: '20px',
    minWidth: '280px',
    maxWidth: '400px',
    background: 'rgba(10, 10, 22, 0.92)',
    border: '1px solid #00e5ff44',
    borderLeft: '3px solid #00e5ff',
    borderRadius: '4px',
    padding: '12px 16px',
    fontFamily: '"JetBrains Mono", "Fira Code", monospace',
    fontSize: '13px',
    color: '#c8d8e8',
    boxShadow: '0 4px 24px rgba(0, 229, 255, 0.08), inset 0 1px 0 rgba(0, 229, 255, 0.05)',
    backdropFilter: 'blur(8px)',
    zIndex: 100,
    animation: 'slideIn 0.3s ease-out',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px',
    paddingBottom: '8px',
    borderBottom: '1px solid #00e5ff22',
  },
  icon: { fontSize: '14px', color: '#00e5ff' },
  title: { color: '#00e5ff', fontWeight: 600, letterSpacing: '0.5px' },
  progress: { marginLeft: 'auto', color: '#668899', fontSize: '11px' },
  body: { lineHeight: 1.5 },
  objTitle: { color: '#ffffff', fontWeight: 500, marginBottom: '4px' },
  objDesc: { color: '#88aacc', fontSize: '12px' },
};

// Inject keyframes
if (typeof document !== 'undefined' && !document.getElementById('objective-hud-styles')) {
  const style = document.createElement('style');
  style.id = 'objective-hud-styles';
  style.textContent = `
    @keyframes slideIn {
      from { opacity: 0; transform: translateX(-20px); }
      to { opacity: 1; transform: translateX(0); }
    }
    .objective-hud { pointer-events: none; }
  `;
  document.head.appendChild(style);
}