/**
 * Types d’actions utilisateur pour la validation automatique des challenges (style TryHackMe).
 * Utiliser ces constantes avec dispatchLabAction({ action: ACTION.XXX, ... }) pour garder
 * la base modulaire et éviter les typos. Ajouter ici tout nouveau type d’action.
 */
export const ACTION = {
  CVE_OPENED: 'cve_opened',
  CVE_SEARCHED: 'cve_searched',
  API_REQUEST: 'api_request',
  TARGET_OPENED: 'target_opened',
  ROOM_OPENED: 'room_opened',
  ROOM_TASK_DONE: 'room_task_done',
  SCENARIO_TASK_DONE: 'scenario_task_done',
  CHALLENGE_DOWNLOAD: 'challenge_download',
};

/** Liste des actions connues (pour doc / validation). */
export const ACTION_LIST = Object.values(ACTION);
