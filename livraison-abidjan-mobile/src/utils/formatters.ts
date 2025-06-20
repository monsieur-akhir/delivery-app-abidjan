export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('fr-CI', {
    style: 'currency',
    currency: 'XOF',
  }).format(amount);
};

export const formatDistance = (distance: number): string => {
  if (distance < 1) {
    return `${Math.round(distance * 1000)}m`;
  }
  return `${distance.toFixed(1)}km`;
};

export const formatDuration = (duration: number): number | string => {
  const hours = Math.floor(duration / 60);
  const minutes = Math.round(duration % 60);

  if (hours > 0) {
    return `${hours}h${minutes > 0 ? ` ${minutes}min` : ''}`;
  }
  return `${minutes}min`;
};

export const formatDate = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('fr-CI', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(dateObj);
};

export const formatPhoneNumber = (phone: string): string => {
  // Format pour les numéros ivoiriens
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('225')) {
    const number = cleaned.substring(3);
    return `+225 ${number.substring(0, 2)} ${number.substring(2, 4)} ${number.substring(4, 6)} ${number.substring(6, 8)}`;
  }
  return phone;
};

export const formatWeight = (weight: number): string => {
  if (weight < 1) {
    return `${Math.round(weight * 1000)}g`;
  }
  return `${weight}kg`;
};

export const formatTime = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatDateTime = (date: Date | string): string => {
  return `${formatDate(date)} à ${formatTime(date)}`;
};

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

export const truncateText = (text: string, maxLength: number): string => {
  if (!text || text.length <= maxLength) return text
  return text.substring(0, maxLength - 3) + '...'
}