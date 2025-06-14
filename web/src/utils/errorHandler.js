/**
 * Gestionnaire d'erreurs global pour l'application
 */

// Configuration des types d'erreurs
const ERROR_TYPES = {
  RUNTIME: 'runtime',
  API: 'api',
  AUTH: 'auth',
  VALIDATION: 'validation',
  NETWORK: 'network',
  VUE: 'vue',
  UNKNOWN: 'unknown',
}

// Configuration des niveaux de sévérité
const SEVERITY_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
}

// Configuration des messages d'erreur
const ERROR_MESSAGES = {
  NETWORK: {
    OFFLINE: 'Vous êtes hors ligne. Vérifiez votre connexion internet.',
    TIMEOUT: 'La requête a expiré. Veuillez réessayer.',
    SERVER_ERROR: 'Une erreur est survenue sur le serveur. Veuillez réessayer plus tard.',
  },
  AUTH: {
    EXPIRED: 'Votre session a expiré. Veuillez vous reconnecter.',
    INVALID: 'Identifiants invalides.',
    UNAUTHORIZED: "Vous n'êtes pas autorisé à effectuer cette action.",
    PERMISSION_DENIED: "Vous n'avez pas les permissions nécessaires pour effectuer cette action.",
  },
  VALIDATION: {
    INVALID_INPUT: 'Les données saisies sont invalides.',
    REQUIRED_FIELD: 'Ce champ est obligatoire.',
  },
  API: {
    PERMISSION_ERROR: "Erreur de permission. Veuillez vérifier vos droits d'accès.",
    SERVER_ERROR: 'Une erreur est survenue sur le serveur. Veuillez réessayer plus tard.',
    NETWORK_ERROR: 'Erreur de connexion au serveur. Veuillez vérifier votre connexion internet.',
  },
}

// Configuration du stockage local
const STORAGE_KEY = 'app_errors'
const MAX_STORED_ERRORS = 50

// Configuration des couleurs pour le terminal
const TERMINAL_COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  fg: {
    black: '\x1b[30m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
  },
  bg: {
    black: '\x1b[40m',
    red: '\x1b[41m',
    green: '\x1b[42m',
    yellow: '\x1b[43m',
    blue: '\x1b[44m',
    magenta: '\x1b[45m',
    cyan: '\x1b[46m',
    white: '\x1b[47m',
  },
}

/**
 * Formate les données d'erreur
 * @param {Error} error - L'erreur à formater
 * @param {string} type - Le type d'erreur
 * @param {string} severity - Le niveau de sévérité
 * @returns {Object} - Les données d'erreur formatées
 */
function formatError(error, type, severity) {
  return {
    message: error.message || 'Erreur inconnue',
    stack: error.stack || '',
    type: type,
    severity: severity,
    timestamp: new Date().toISOString(),
    url: window.location.href,
    userAgent: navigator.userAgent,
    userId: getCurrentUserId() || 'anonymous',
  }
}

/**
 * Récupère l'ID de l'utilisateur actuel
 * @returns {string|null} - L'ID de l'utilisateur ou null
 */
function getCurrentUserId() {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    return user.id || null
  } catch (e) {
    return null
  }
}

/**
 * Vérifie si l'erreur est redondante
 * @param {Object} errorData - Les données d'erreur formatées
 * @returns {boolean} - True si l'erreur est redondante
 */
function isRedundantError(errorData) {
  const recentErrors = getStoredErrors()
  const timeWindow = 5 * 60 * 1000 // 5 minutes
  const now = Date.now()

  return recentErrors.some(error => {
    const errorTime = new Date(error.timestamp).getTime()
    return (
      error.message === errorData.message &&
      error.type === errorData.type &&
      now - errorTime < timeWindow
    )
  })
}

/**
 * Stocke l'erreur localement
 * @param {Object} errorData - Les données d'erreur formatées
 */
function storeError(errorData) {
  try {
    // Vérifier si localStorage est disponible
    if (typeof localStorage === 'undefined') {
      console.warn("localStorage n'est pas disponible")
      return
    }

    const errors = getStoredErrors()
    errors.unshift(errorData)

    // Limiter le nombre d'erreurs stockées
    if (errors.length > MAX_STORED_ERRORS) {
      errors.pop()
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(errors))
  } catch (e) {
    console.error('Erreur lors du stockage local:', e)
  }
}

/**
 * Récupère les erreurs stockées localement
 * @returns {Array} - Liste des erreurs stockées
 */
function getStoredErrors() {
  try {
    if (typeof localStorage === 'undefined') {
      return []
    }
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch (e) {
    console.error('Erreur lors de la récupération des erreurs stockées:', e)
    return []
  }
}

/**
 * Log l'erreur dans le terminal en mode développement
 * @param {Object} errorData - Les données d'erreur formatées
 */
function logToTerminal(errorData) {
  if (import.meta.env.DEV) {
    const { fg, bg, bright, reset } = TERMINAL_COLORS
    const severityColors = {
      [SEVERITY_LEVELS.CRITICAL]: `${bg.red}${fg.white}`,
      [SEVERITY_LEVELS.HIGH]: `${fg.red}`,
      [SEVERITY_LEVELS.MEDIUM]: `${fg.yellow}`,
      [SEVERITY_LEVELS.LOW]: `${fg.blue}`,
    }

    const typeColors = {
      [ERROR_TYPES.RUNTIME]: `${fg.red}`,
      [ERROR_TYPES.API]: `${fg.yellow}`,
      [ERROR_TYPES.AUTH]: `${fg.magenta}`,
      [ERROR_TYPES.VALIDATION]: `${fg.blue}`,
      [ERROR_TYPES.NETWORK]: `${fg.cyan}`,
      [ERROR_TYPES.VUE]: `${fg.green}`,
      [ERROR_TYPES.UNKNOWN]: `${fg.white}`,
    }

    const severityColor = severityColors[errorData.severity] || fg.white
    const typeColor = typeColors[errorData.type] || fg.white

    console.log('\n' + '='.repeat(80))
    console.log(
      `${bright}${severityColor}[${errorData.severity.toUpperCase()}]${reset} ${typeColor}[${errorData.type.toUpperCase()}]${reset}`
    )
    console.log(`${bright}Message:${reset} ${errorData.message}`)
    console.log(`${bright}Timestamp:${reset} ${errorData.timestamp}`)
    console.log(`${bright}URL:${reset} ${errorData.url}`)

    if (errorData.stack) {
      console.log(`${bright}Stack:${reset}`)
      console.log(errorData.stack)
    }

    console.log('='.repeat(80) + '\n')
  }
}

/**
 * Envoie l'erreur au serveur de logging
 * @param {Object} errorData - Les données d'erreur formatées
 */
async function sendErrorToServer(errorData) {
  try {
    // Ne pas envoyer les erreurs en mode développement
    if (import.meta.env.DEV) {
      return
    }

    const response = await fetch('/api/errors', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(errorData),
    })

    if (!response.ok) {
      console.warn("Erreur lors de l'envoi au serveur de logging:", response.statusText)
    }
  } catch (e) {
    console.warn("Impossible d'envoyer l'erreur au serveur:", e.message)
  }
}

/**
 * Affiche une notification à l'utilisateur
 * @param {Error} error - L'erreur
 * @param {string} severity - Le niveau de sévérité
 */
function showNotification(error, severity) {
  // Pour Vue 3, nous utiliserons un système de notification simple
  if (typeof window !== 'undefined' && window.__VUE_APP__) {
    // Utiliser le système de notification de l'app Vue si disponible
    const app = window.__VUE_APP__
    if (app.config.globalProperties.$notify) {
      app.config.globalProperties.$notify({
        title: 'Erreur',
        message: error.message,
        type: severity === SEVERITY_LEVELS.CRITICAL ? 'error' : 'warning',
        duration: severity === SEVERITY_LEVELS.LOW ? 3000 : 5000,
      })
      return
    }
  }

  // Fallback vers une notification browser native
  if (severity === SEVERITY_LEVELS.CRITICAL || severity === SEVERITY_LEVELS.HIGH) {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification("Erreur de l'application", {
        body: error.message,
        icon: '/favicon.ico',
      })
    } else {
      // Fallback vers une alerte simple
      console.error('Erreur critique:', error.message)
    }
  }
}

/**
 * Gestionnaire d'erreurs global
 * @param {Error} error - L'erreur à gérer
 * @param {string} type - Le type d'erreur
 * @param {string} severity - Le niveau de sévérité
 */
export function handleError(error, type = ERROR_TYPES.UNKNOWN, severity = SEVERITY_LEVELS.MEDIUM) {
  // Gestion spéciale des erreurs d'API
  if (error?.response?.status === 403) {
    error.message = ERROR_MESSAGES.AUTH.PERMISSION_DENIED
    type = ERROR_TYPES.AUTH
    severity = SEVERITY_LEVELS.HIGH
  } else if (error?.response?.status === 401) {
    error.message = ERROR_MESSAGES.AUTH.EXPIRED
    type = ERROR_TYPES.AUTH
    severity = SEVERITY_LEVELS.HIGH
  } else if (error?.response?.status >= 500) {
    error.message = ERROR_MESSAGES.API.SERVER_ERROR
    type = ERROR_TYPES.API
    severity = SEVERITY_LEVELS.HIGH
  } else if (error?.response?.status >= 400) {
    error.message = ERROR_MESSAGES.API.PERMISSION_ERROR
    type = ERROR_TYPES.API
    severity = SEVERITY_LEVELS.MEDIUM
  }

  const errorData = formatError(error, type, severity)

  // Vérifier si l'erreur est redondante
  if (isRedundantError(errorData)) {
    return
  }

  // Stocker l'erreur localement
  storeError(errorData)

  // Log dans le terminal en mode développement
  logToTerminal(errorData)

  // Envoyer au serveur de logging
  sendErrorToServer(errorData)

  // Afficher une notification à l'utilisateur
  showNotification(error, severity)
}

/**
 * Initialise le gestionnaire d'erreurs global
 */
export function initErrorHandler(app) {
  // Gestionnaire d'erreurs non capturées
  window.onerror = function (message, source, lineno, colno, error) {
    handleError(error || new Error(message), ERROR_TYPES.RUNTIME, SEVERITY_LEVELS.HIGH)
    return false
  }

  // Gestionnaire de rejets de promesses non capturés
  window.onunhandledrejection = function (event) {
    handleError(event.reason, ERROR_TYPES.RUNTIME, SEVERITY_LEVELS.HIGH)
  }

  // Gestionnaire d'erreurs de chargement de ressources
  window.addEventListener(
    'error',
    function (event) {
      if (event.target instanceof HTMLElement) {
        handleError(
          new Error(`Erreur de chargement de ressource: ${event.target.tagName}`),
          ERROR_TYPES.RUNTIME,
          SEVERITY_LEVELS.MEDIUM
        )
      }
    },
    true
  )

  // Gestionnaire d'erreurs réseau
  window.addEventListener('offline', () => {
    handleError(
      new Error(ERROR_MESSAGES.NETWORK.OFFLINE),
      ERROR_TYPES.NETWORK,
      SEVERITY_LEVELS.HIGH
    )
  })

  // Gestionnaire d'erreurs Vue
  if (app) {
    app.config.errorHandler = error => {
      handleError(error, ERROR_TYPES.VUE, SEVERITY_LEVELS.HIGH)
    }
  }

  if (import.meta.env.DEV) {
    console.log(
      `${TERMINAL_COLORS.fg.green}${TERMINAL_COLORS.bright}Gestionnaire d'erreurs global initialisé en mode développement${TERMINAL_COLORS.reset}`
    )
  } else {
    console.log("Gestionnaire d'erreurs global initialisé")
  }
}

// Exporter les constantes et fonctions pour une utilisation externe
export { ERROR_TYPES, SEVERITY_LEVELS, getStoredErrors }
