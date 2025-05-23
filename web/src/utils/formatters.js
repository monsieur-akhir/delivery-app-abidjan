/**
 * Formater un prix en FCFA
 * @param {Number} price - Prix à formater
 * @param {Boolean} withSymbol - Inclure le symbole FCFA
 * @returns {String} - Prix formaté
 */
export const formatPrice = (price, withSymbol = false) => {
  if (price === null || price === undefined) return ""

  const formattedPrice = new Intl.NumberFormat("fr-FR").format(price)
  return withSymbol ? `${formattedPrice} FCFA` : formattedPrice
}

/**
 * Formater une date (jour/mois/année)
 * @param {String|Date} date - Date à formater
 * @returns {String} - Date formatée
 */
export const formatDate = (date) => {
  if (!date) return ""

  const dateObj = new Date(date)
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(dateObj)
}

/**
 * Formater une date et heure (jour/mois/année heure:minute)
 * @param {String|Date} date - Date à formater
 * @returns {String} - Date et heure formatées
 */
export const formatDateTime = (date) => {
  if (!date) return ""

  const dateObj = new Date(date)
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(dateObj)
}

/**
 * Formater une heure (heure:minute)
 * @param {String|Date} date - Date à formater
 * @returns {String} - Heure formatée
 */
export const formatTime = (date) => {
  if (!date) return ""

  const dateObj = new Date(date)
  return new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(dateObj)
}

/**
 * Formater un numéro de téléphone
 * @param {String} phone - Numéro de téléphone à formater
 * @returns {String} - Numéro de téléphone formaté
 */
export const formatPhone = (phone) => {
  if (!phone) return ""

  // Format ivoirien: +225 XX XX XX XX XX
  if (phone.startsWith("+225")) {
    return phone.replace(/(\+225)(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, "$1 $2 $3 $4 $5 $6")
  }

  return phone
}

/**
 * Tronquer un texte à une longueur donnée
 * @param {String} text - Texte à tronquer
 * @param {Number} length - Longueur maximale
 * @param {String} suffix - Suffixe à ajouter si le texte est tronqué
 * @returns {String} - Texte tronqué
 */
export const truncateText = (text, length = 100, suffix = "...") => {
  if (!text) return ""

  if (text.length <= length) return text

  return text.substring(0, length).trim() + suffix
}

/**
 * Formater une distance en kilomètres
 * @param {Number} distance - Distance en kilomètres
 * @returns {String} - Distance formatée
 */
export const formatDistance = (distance) => {
  if (distance === null || distance === undefined) return ""

  if (distance < 1) {
    // Convertir en mètres
    const meters = Math.round(distance * 1000)
    return `${meters} m`
  }

  return `${distance.toFixed(1)} km`
}

/**
 * Formater une durée en minutes
 * @param {Number} duration - Durée en minutes
 * @returns {String} - Durée formatée
 */
export const formatDuration = (duration) => {
  if (duration === null || duration === undefined) return ""

  if (duration < 60) {
    return `${duration} min`
  }

  const hours = Math.floor(duration / 60)
  const minutes = duration % 60

  if (minutes === 0) {
    return `${hours} h`
  }

  return `${hours} h ${minutes} min`
}

/**
 * Obtenir les initiales d'un nom
 * @param {String} name - Nom complet
 * @returns {String} - Initiales
 */
export const getInitials = (name) => {
  if (!name) return ""

  return name
    .split(" ")
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase()
    .substring(0, 2)
}

/**
 * Formater un pourcentage
 * @param {Number} value - Valeur à formater
 * @param {Number} decimals - Nombre de décimales
 * @returns {String} - Pourcentage formaté
 */
export const formatPercentage = (value, decimals = 1) => {
  if (value === null || value === undefined) return ""

  return `${value.toFixed(decimals)}%`
}

/**
 * Formater un statut de livraison
 * @param {String} status - Statut à formater
 * @returns {String} - Statut formaté
 */
export const formatDeliveryStatus = (status) => {
  const statusMap = {
    'pending\
