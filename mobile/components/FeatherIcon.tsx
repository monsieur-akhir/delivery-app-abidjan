import React from 'react';
import { Ionicons } from '@expo/vector-icons';

export interface FeatherIconProps {
  name: string;
  size?: number;
  color?: string;
  style?: any;
}

// Map common Feather icon names to Ionicons
const iconMap: { [key: string]: keyof typeof Ionicons.glyphMap } = {
  'home': 'home-outline',
  'search': 'search-outline',
  'package': 'cube-outline',
  'user': 'person-outline',
  'bell': 'notifications-outline',
  'settings': 'settings-outline',
  'truck': 'car-outline',
  'map': 'map-outline',
  'dollar-sign': 'cash-outline',
  'clock': 'time-outline',
  'check': 'checkmark-outline',
  'x': 'close-outline',
  'phone': 'call-outline',
  'mail': 'mail-outline',
  'location': 'location-outline',
  'star': 'star-outline',
  'heart': 'heart-outline',
  'camera': 'camera-outline',
  'image': 'image-outline',
  'lock': 'lock-closed-outline',
  'unlock': 'lock-open-outline',
  'eye': 'eye-outline',
  'eye-off': 'eye-off-outline',
  'edit': 'create-outline',
  'trash': 'trash-outline',
  'plus': 'add-outline',
  'minus': 'remove-outline',
  'arrow-left': 'arrow-back-outline',
  'arrow-right': 'arrow-forward-outline',
  'arrow-up': 'arrow-up-outline',
  'arrow-down': 'arrow-down-outline',
  'chevron-left': 'chevron-back-outline',
  'chevron-right': 'chevron-forward-outline',
  'chevron-up': 'chevron-up-outline',
  'chevron-down': 'chevron-down-outline',
  'refresh': 'refresh-outline',
  'download': 'download-outline',
  'upload': 'cloud-upload-outline',
  'share': 'share-outline',
  'menu': 'menu-outline',
  'more-vertical': 'ellipsis-vertical-outline',
  'more-horizontal': 'ellipsis-horizontal-outline',
  'grid': 'grid-outline',
  'list': 'list-outline',
  'calendar': 'calendar-outline',
  'bookmark': 'bookmark-outline',
  'flag': 'flag-outline',
  'filter': 'filter-outline',
  'wifi': 'wifi-outline',
  'wifi-off': 'wifi-outline',
  'battery': 'battery-full-outline',
  'volume': 'volume-high-outline',
  'volume-off': 'volume-mute-outline',
  'play': 'play-outline',
  'pause': 'pause-outline',
  'stop': 'stop-outline',
  'skip-back': 'play-skip-back-outline',
  'skip-forward': 'play-skip-forward-outline',
  'repeat': 'repeat-outline',
  'shuffle': 'shuffle-outline',
  'mic': 'mic-outline',
  'mic-off': 'mic-off-outline',
  'video': 'videocam-outline',
  'video-off': 'videocam-outline',
  'monitor': 'desktop-outline',
  'smartphone': 'phone-portrait-outline',
  'tablet': 'tablet-portrait-outline',
  'laptop': 'laptop-outline',
  'printer': 'print-outline',
  'database': 'server-outline',
  'cloud': 'cloud-outline',
  'link': 'link-outline',
  'external-link': 'open-outline',
  'file': 'document-outline',
  'folder': 'folder-outline',
  'shopping-bag': 'bag-outline',
  'shopping-cart': 'cart-outline',
  'credit-card': 'card-outline',
  'gift': 'gift-outline',
  'tool': 'construct-outline',
  'wrench': 'build-outline',
  'sliders': 'options-outline',
  'users': 'people-outline',
  'user-plus': 'person-add-outline',
  'user-minus': 'person-remove-outline',
  'user-check': 'person-outline',
  'message-circle': 'chatbubble-outline',
  'message-square': 'chatbox-outline',
  'send': 'send-outline',
  'paperclip': 'attach-outline',
  'globe': 'globe-outline',
  'trending-up': 'trending-up-outline',
  'trending-down': 'trending-down-outline',
  'bar-chart': 'bar-chart-outline',
  'pie-chart': 'pie-chart-outline',
  'activity': 'pulse-outline',
  'zap': 'flash-outline',
  'sun': 'sunny-outline',
  'moon': 'moon-outline',
  'cloud-rain': 'rainy-outline',
  'thermometer': 'thermometer-outline',
  'key': 'key-outline',
  'shield': 'shield-outline',
  'award': 'trophy-outline',
  'target': 'radio-button-on-outline',
  'coffee': 'cafe-outline',
  'briefcase': 'briefcase-outline',
  'layers': 'layers-outline',
  'package-variant': 'cube-outline',
  'truck-delivery': 'car-outline',
  'motorcycle': 'bicycle-outline',
  'bicycle': 'bicycle-outline',
  'scooter': 'bicycle-outline',
  'van': 'car-outline',
  'car': 'car-outline'
}

export type FeatherIconName = keyof typeof iconMap

export const FeatherIcon: React.FC<FeatherIconProps> = ({
  name,
  size = 24,
  color = '#000000',
  style,
}) => {
  const ioniconsName = iconMap[name] || 'help-outline'

  return (
    <Ionicons
      name={ioniconsName}
      size={size}
      color={color}
      style={style}
    />
  )
}

export { FeatherIconName }
export default FeatherIcon;