/**
 * Format a price to a string with the currency symbol
 * @param price The price to format
 * @returns The formatted price
 */
export const formatPrice = (price: number): string => {
  return price.toLocaleString("fr-FR")
}

/**
 * Format a date to a string
 * @param date The date to format
 * @returns The formatted date
 */
export const formatDate = (date: string): string => {
  const d = new Date(date)
  return d.toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

/**
 * Format a distance to a string
 * @param distance The distance to format in kilometers
 * @returns The formatted distance
 */
export const formatDistance = (distance: number): string => {
  if (distance < 1) {
    return `${Math.round(distance * 1000)} m`
  }
  return `${distance.toFixed(1)} km`
}

/**
 * Format a relative time to a string
 * @param date The date to format
 * @returns The formatted relative time
 */
export const formatRelativeTime = (date: string): string => {
  const now = new Date()
  const d = new Date(date)
  const diff = now.getTime() - d.getTime()
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) {
    return `Il y a ${days} jour${days > 1 ? "s" : ""}`
  }
  if (hours > 0) {
    return `Il y a ${hours} heure${hours > 1 ? "s" : ""}`
  }
  if (minutes > 0) {
    return `Il y a ${minutes} minute${minutes > 1 ? "s" : ""}`
  }
  return "À l'instant"
}

/**
 * Format a currency value
 * @param value The value to format
 * @returns The formatted currency
 */
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "XOF",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
    .format(value)
    .replace("XOF", "")
    .trim()
}

/**
 * Format a duration in seconds to a string (HH:MM:SS)
 * @param seconds The duration in seconds
 * @returns The formatted duration
 */
export const formatDurationSeconds = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  
  if (hours > 0) {
    return `${hours} h ${minutes} min`
  }
  return `${minutes} min`
}

/**
 * Format a duration to a string
 * @param minutes The duration to format in minutes
 * @returns The formatted duration
 */
export const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes} min`
  } else {
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    if (remainingMinutes === 0) {
      return `${hours} h`
    } else {
      return `${hours} h ${remainingMinutes} min`
    }
  }
  }


/**
 * Format a time string to a readable time format (HH:MM)
 * @param timeString The time string to format
 * @returns The formatted time
 */
export const formatTime = (timeString: string): string => {
  const date = new Date(timeString)
  return date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
}
