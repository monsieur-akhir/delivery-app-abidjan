// Formatage des prix
export const formatPrice = (price: number): string => {
  if (!price && price !== 0) return "N/A"
  return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")
}

// Formatage des dates
export const formatDate = (dateString: string): string => {
  if (!dateString) return "N/A"

  const date = new Date(dateString)
  return date.toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

// Formatage des dates relatives
export const formatRelativeTime = (dateString: string): string => {
  if (!dateString) return "N/A"

  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)
  const diffMonth = Math.floor(diffDay / 30)
  const diffYear = Math.floor(diffMonth / 12)

  if (diffSec < 60) {
    return "À l'instant"
  } else if (diffMin < 60) {
    return `Il y a ${diffMin} min`
  } else if (diffHour < 24) {
    return `Il y a ${diffHour} h`
  } else if (diffDay < 30) {
    return `Il y a ${diffDay} j`
  } else if (diffMonth < 12) {
    return `Il y a ${diffMonth} mois`
  } else {
    return `Il y a ${diffYear} an${diffYear > 1 ? "s" : ""}`
  }
}

// Formatage des distances
export const formatDistance = (distance: number): string => {
  if (!distance && distance !== 0) return "N/A"

  if (distance < 1) {
    return `${Math.round(distance * 1000)} m`
  } else {
    return `${distance.toFixed(1)} km`
  }
}

// Formatage du temps
export const formatTime = (minutes: number): string => {
  if (!minutes && minutes !== 0) return "N/A"

  if (minutes < 60) {
    return `${minutes} min`
  } else {
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return `${hours} h ${remainingMinutes > 0 ? remainingMinutes + " min" : ""}`
  }
}

// Formatage des numéros de téléphone
export const formatPhoneNumber = (phone: string): string => {
  if (!phone) return "N/A"

  // Format pour les numéros ivoiriens (exemple: +225 XX XX XX XX XX)
  if (phone.startsWith("+225") || phone.startsWith("225")) {
    const cleaned = phone.replace(/\D/g, "").replace(/^225/, "")
    if (cleaned.length === 10) {
      return `+225 ${cleaned.slice(0, 2)} ${cleaned.slice(2, 4)} ${cleaned.slice(4, 6)} ${cleaned.slice(6, 8)} ${cleaned.slice(8, 10)}`
    }
  }

  return phone
}

// Formatage des pourcentages
export const formatPercentage = (value: number): string => {
  if (value === null || value === undefined) return "N/A"
  return `${Math.round(value)}%`
}

// Formatage des notes
export const formatRating = (rating: number): string => {
  if (!rating && rating !== 0) return "N/A"
  return rating.toFixed(1)
}

export default {
  formatPrice,
  formatDate,
  formatRelativeTime,
  formatDistance,
  formatTime,
  formatPhoneNumber,
  formatPercentage,
  formatRating,
}
