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

export const formatCurrency = (amount: number, currency: string = 'FCFA'): string => {
  return `${formatPrice(amount)} ${currency}`
}

export const formatDistanceKm = (distance: number): string => {
  if (distance < 1000) {
    return `${distance.toFixed(0)}m`
  }
  return `${(distance / 1000).toFixed(1)}km`
}

export const formatDate2 = (date: string | Date): string => {
  return new Intl.DateTimeFormat('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(new Date(date))
}

export const formatTime2 = (date: string | Date): string => {
  return new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date))
}

export const formatRelativeTime = (date: string | Date): string => {
  const now = new Date()
  const then = new Date(date)
  const diffInMs = now.getTime() - then.getTime()
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
  const diffInHours = Math.floor(diffInMinutes / 60)
  const diffInDays = Math.floor(diffInHours / 24)

  if (diffInMinutes < 1) return 'À l\'instant'
  if (diffInMinutes < 60) return `Il y a ${diffInMinutes} min`
  if (diffInHours < 24) return `Il y a ${diffInHours}h`
  if (diffInDays < 7) return `Il y a ${diffInDays}j`

  return formatDate2(date)
}