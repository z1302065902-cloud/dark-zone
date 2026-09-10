/**
 * i18n — 中英双语文案
 * 使用: import { t, setLang } from './i18n';
 * 切换语言: setLang('zh') | setLang('en')
 * 所有硬编码中文/英文字符串统一从此获取
 */

export type Lang = 'zh' | 'en';
let currentLang: Lang = 'zh';

export function setLang(lang: Lang) {
  currentLang = lang;
}
export function getLang(): Lang { return currentLang; }

type Dict = Record<string, string | ((...a: unknown[]) => string)>;

const ZH: Dict = {
  // Menu
  menu_start: '开始游戏',
  menu_lang_zh: '中文',
  menu_lang_en: 'English',
  game_title: '黑域：诡城',
  game_subtitle: 'DARK ZONE',
  menu_continue: '继续游戏',
  menu_main: '主菜单',
  pause_title: '游戏暂停',
  pause_resume: '继续游戏',
  pause_menu: '主菜单',
  gameover_title: '任务失败',
  gameover_desc: '您已牺牲在黑暗中…',
  levelcomplete_title: '关卡完成',
  levelcomplete_desc: '成功逃离当前区域',

  // HUD labels
  hud_hp: '生命值',
  hud_sta: '体力',
  hud_ammo: '弹药',
  hud_reload: '装填中…',
  hud_inventory: '背包',
  hud_close: 'TAB 关闭',
  hud_weapons: '武器',
  hud_items: '物品',
  hud_empty: '（空）',
  hud_equipped: '已装备',
  hud_objectives: '任务目标',
  hud_obj_count: (n: number) => `${n}/9 已完成`,
  hud_crosshair_ads: '瞄准',

  // Weapons
  w_stunGun: '电击枪',
  w_pistol: '手枪',
  w_shotgun: '霰弹枪',
  w_energyGun: '能量武器',
  w_knife: '小刀',
  w_axe: '消防斧',
  w_baton: '铁棍',
  w_chainsaw: '电锯',

  // Enemies
  enemy_patient: '病房护士',
  enemy_nurse: '病原体护士',
  enemy_butcher: '地铁屠夫',
  enemy_nurse07: '护士-07',
  enemy_overseer: '主控生物体',

  // Items
  item_keycard: '门禁卡',
  item_fuse: '保险丝',
  item_master_key: '实验室主钥匙',
  item_medkit: '医疗包',
  item_battery: '电池',
  item_ammo: '弹药',

  // Objectives (title, description tuples)
  obj_find_keycard: { title: '寻找门禁卡', desc: '在接待台找到门禁卡' },
  obj_unlock_emergency: { title: '解锁急诊区', desc: '用门禁卡打开急诊区大门' },
  obj_find_fuse: { title: '寻找保险丝', desc: '在急诊区找到备用保险丝' },
  obj_fusebox_emergency: { title: '检查配电箱', desc: '查看急诊区配电箱' },
  obj_insert_fuse: { title: '安装保险丝', desc: '将保险丝插入配电箱' },
  obj_restore_power: { title: '恢复供电', desc: '电源恢复，紧急照明亮起' },
  obj_door_surgery: { title: '手术区大门解锁', desc: '手术区大门解锁，继续前进' },
  obj_find_master_key: { title: '寻找主钥匙', desc: '在手术区找到通往地下实验室的主钥匙' },
  obj_enter_lab: { title: '进入地下实验室', desc: '打开通往地下实验室的大门' },
  obj_defeat_boss: { title: '击败主控生物体', desc: '消灭 Boss，解除威胁' },
  obj_escape_hospital: { title: '逃离医院', desc: '通过地下实验室的出口离开' },
  obj_levelcomplete: { title: '关卡完成', desc: '成功逃离当前区域' },

  // Interactions
  interact_e: '按 E',
  interact_confirm: '确认',
  interact_locked: '已锁定',
  interact_unlocked: '已解锁',
  interact_needed: (item: string) => `需要 ${item}`,
  interact_install: '安装保险丝',
  interact_unlock_door: '解锁大门',
  interact_open: '打开',
  interact_obtained: (item: string) => `✅ 获得：${item}`,
  interact_added: '已加入背包',
  interact_pickup: '拾取 (E)',
  interact_savepoint: '存档点',
  interact_save_desc: '保存游戏进度',
  door_locked: '门已锁定',
  door_keycard: '门禁卡 (E)',
  door_key: '主钥匙 (E)',
  door_master_key: '实验室主钥匙 (E)',
  door_power: '恢复电力',
  door_requires: (item: string) => `需要：${item}`,
  fuse_box: '🔌 配电箱',
  fuse_needed: (n: number) => `还需 ${n} 个`,

  // Boss
  boss_name: '☠ 主控生物体',

  // Level signs (in-world text on walls)
  sign_hospital: '赛博生化医院',
  sign_surgery: '手术区',
  sign_lab: '实验室',
  sign_elevator: '电梯',
  sign_power_room: '配电室',
  sign_exit: 'EXIT 出口',
  lvl_metro: '荒废地铁',
  lvl_forest: '黑森林',
  lvl_town: '废弃小镇',
  lvl_altar: '地下祭坛',
  lvl_hospital: '赛博生化医院',
  obj_current: '当前目标',

  // Weapon pickup
  wp_pistol: '手枪',
  wp_shotgun: '霰弹枪',
  wp_switch: '按 1/2 切换武器',

  // Debug
  debug_enemy_count: '敌人数量',
  debug_collider_count: '碰撞体数量',
};

const EN: Dict = {
  menu_start: 'Start Game',
  menu_lang_zh: '中文',
  menu_lang_en: 'English',
  game_title: 'DARK ZONE',
  game_subtitle: 'CYBER BIOPUNK HOSPITAL',
  menu_continue: 'Continue',
  menu_main: 'Main Menu',
  pause_title: 'GAME PAUSED',
  pause_resume: 'Resume',
  pause_menu: 'Main Menu',
  gameover_title: 'MISSION FAILED',
  gameover_desc: 'You fell into the darkness…',
  levelcomplete_title: 'LEVEL COMPLETE',
  levelcomplete_desc: 'Successfully escaped the area',

  hud_hp: 'HP',
  hud_sta: 'STA',
  hud_ammo: 'AMMO',
  hud_reload: 'RELOADING…',
  hud_inventory: 'INVENTORY',
  hud_close: 'TAB close',
  hud_weapons: 'WEAPONS',
  hud_items: 'ITEMS',
  hud_empty: '(empty)',
  hud_equipped: 'EQUIPPED',
  hud_objectives: 'OBJECTIVES',
  hud_obj_count: (n: number) => `${n}/9 DONE`,
  hud_crosshair_ads: 'ADS',

  w_stunGun: 'Stun Gun',
  w_pistol: 'Pistol',
  w_shotgun: 'Shotgun',
  w_energyGun: 'Energy Gun',
  w_knife: 'Knife',
  w_axe: 'Fire Axe',
  w_baton: 'Baton',
  w_chainsaw: 'Chainsaw',

  enemy_patient: 'Ward Nurse',
  enemy_nurse: 'Pathogen Nurse',
  enemy_butcher: 'Metro Butcher',
  enemy_nurse07: 'Nurse-07',
  enemy_overseer: 'OVERSEER',

  item_keycard: 'Keycard',
  item_fuse: 'Fuse',
  item_master_key: 'Master Key',
  item_medkit: 'Medkit',
  item_battery: 'Battery',
  item_ammo: 'Ammo',

  obj_find_keycard: { title: 'Find Keycard', desc: 'Find the keycard at the reception desk' },
  obj_unlock_emergency: { title: 'Unlock Emergency', desc: 'Use the keycard to open the Emergency door' },
  obj_find_fuse: { title: 'Find Fuse', desc: 'Find a spare fuse in the Emergency wing' },
  obj_fusebox_emergency: { title: 'Check Fuse Box', desc: 'Inspect the Emergency fuse box' },
  obj_insert_fuse: { title: 'Insert Fuse', desc: 'Insert the fuse into the box' },
  obj_restore_power: { title: 'Power Restored', desc: 'Emergency lighting activated' },
  obj_door_surgery: { title: 'Surgery Door Unlocked', desc: 'Surgery door unlocked, proceed onward' },
  obj_find_master_key: { title: 'Find Master Key', desc: 'Find the master key to the underground lab in Surgery' },
  obj_enter_lab: { title: 'Enter Lab', desc: 'Open the door to the underground laboratory' },
  obj_defeat_boss: { title: 'Defeat the Overseer', desc: 'Eliminate the boss, end the threat' },
  obj_escape_hospital: { title: 'Escape Hospital', desc: 'Exit through the underground lab' },
  obj_levelcomplete: { title: 'Level Complete', desc: 'Successfully escaped the area' },

  interact_e: 'Press E',
  interact_confirm: 'Confirm',
  interact_locked: 'LOCKED',
  interact_unlocked: 'UNLOCKED',
  interact_needed: (item: string) => `Needs ${item}`,
  interact_install: 'Install Fuse',
  interact_unlock_door: 'Unlock Door',
  interact_open: 'Open',
  interact_obtained: (item: string) => `✅ Obtained: ${item}`,
  interact_added: 'Added to inventory',
  interact_pickup: 'Pick up (E)',
  interact_savepoint: 'Save Point',
  interact_save_desc: 'Save game progress',
  door_locked: 'DOOR LOCKED',
  door_keycard: 'Keycard (E)',
  door_key: 'Master Key (E)',
  door_master_key: 'Lab Master Key (E)',
  door_power: 'Restore Power',
  door_requires: (item: string) => `Requires: ${item}`,
  fuse_box: '🔌 FUSE BOX',
  fuse_needed: (n: number) => `${n} more needed`,

  boss_name: '☠ OVERSEER UNIT',

  sign_hospital: 'CYBER BIOLAB HOSPITAL',
  sign_surgery: 'SURGERY',
  sign_lab: 'LAB',
  sign_elevator: 'ELEVATOR',
  sign_power_room: 'POWER ROOM',
  sign_exit: 'EXIT 出口',
  lvl_metro: 'Abandoned Metro',
  lvl_forest: 'Black Forest',
  lvl_town: 'Deserted Town',
  lvl_altar: 'Underground Altar',
  lvl_hospital: 'Cyber Biolab Hospital',
  obj_current: 'CURRENT OBJECTIVE',

  wp_pistol: 'Pistol',
  wp_shotgun: 'Shotgun',
  wp_switch: 'Press 1/2 to switch weapons',

  debug_enemy_count: 'Enemies',
  debug_collider_count: 'Colliders',
};

const DICT: Record<Lang, Dict> = { zh: ZH, en: EN };

export function t(key: string, ...args: unknown[]): string {
  const raw = DICT[currentLang][key];
  if (raw === undefined) return key;
  if (typeof raw === 'function') return (raw as (...a: unknown[]) => string)(...args);
  return raw as string;
}

export function getCurrentLang(): Lang { return currentLang; }
