export const formatDate = (dateString: string, format?: string): string => {
  if (!dateString) return ''

  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return dateString

    if (format === 'short') {
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    }

    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  } catch {
    return dateString
  }
}

export const formatPrice = (price: number): string => {
  if (typeof price !== 'number' || isNaN(price)) return '0'
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price)
}

export const formatDistance = (distanceInMeters: number): string => {
  if (distanceInMeters < 1000) {
    return `${Math.round(distanceInMeters)}m`
  }
  return `${(distanceInMeters / 1000).toFixed(1)}km`
}

export const formatDuration = (durationInMinutes: number): string => {
  if (durationInMinutes < 60) {
    return `${Math.round(durationInMinutes)}min`
  }
  const hours = Math.floor(durationInMinutes / 60)
  const minutes = Math.round(durationInMinutes % 60)
  return minutes > 0 ? `${hours}h${minutes}min` : `${hours}h`
}

export const formatPhoneNumber = (phone: string): string => {
  if (!phone) return ''

  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '')

  // Format based on length
  if (digits.length === 8) {
    // Ivorian local number: XX XX XX XX
    return digits.replace(/(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4')
  } else if (digits.length === 10 && digits.startsWith('0')) {
    // Ivorian number with leading 0: 0X XX XX XX XX
    return digits.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5')
  } else if (digits.length >= 10) {
    // International format
    return `+${digits}`
  }

  return phone
}

export const formatTime = (timeString: string): string => {
  if (!timeString) return ''

  try {
    const date = new Date(timeString)
    if (isNaN(date.getTime())) return timeString

    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return timeString
  }
}

export const truncateText = (text: string, maxLength: number): string => {
  if (!text || text.length <= maxLength) return text
  return text.substring(0, maxLength - 3) + '...'
}