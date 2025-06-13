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
  'package': 'package-outline',
  'credit-card': 'card-outline',
  'bell': 'notifications-outline',
  'user': 'person-outline',
  'grid': 'grid-outline',
  'truck': 'car-outline',
  'dollar-sign': 'cash-outline',
  'users': 'people-outline',
  'circle': 'ellipse-outline',
  'check': 'checkmark-outline',
  'x': 'close-outline',
  'arrow-left': 'arrow-back-outline',
  'arrow-right': 'arrow-forward-outline',
  'plus': 'add-outline',
  'minus': 'remove-outline',
  'search': 'search-outline',
  'filter': 'funnel-outline',
  'map-pin': 'location-outline',
  'phone': 'call-outline',
  'mail': 'mail-outline',
  'lock': 'lock-closed-outline',
  'eye': 'eye-outline',
  'eye-off': 'eye-off-outline',
  'camera': 'camera-outline',
  'image': 'image-outline',
  'star': 'star-outline',
  'heart': 'heart-outline',
  'share': 'share-outline',
  'more-horizontal': 'ellipsis-horizontal-outline',
  'more-vertical': 'ellipsis-vertical-outline',
  'settings': 'settings-outline',
  'help-circle': 'help-circle-outline',
  'info': 'information-circle-outline',
  'alert-triangle': 'warning-outline',
  'alert-circle': 'alert-circle-outline',
  'check-circle': 'checkmark-circle-outline',
  'x-circle': 'close-circle-outline',
  'calendar': 'calendar-outline',
  'clock': 'time-outline',
  'download': 'download-outline',
  'upload': 'cloud-upload-outline',
  'edit': 'create-outline',
  'trash': 'trash-outline',
  'refresh': 'refresh-outline',
  'play': 'play-outline',
  'pause': 'pause-outline',
  'stop': 'stop-outline',
  'volume-2': 'volume-high-outline',
  'volume-x': 'volume-mute-outline',
  'wifi': 'wifi-outline',
  'wifi-off': 'wifi-outline',
  'battery': 'battery-full-outline',
  'bluetooth': 'bluetooth-outline',
  'gps': 'navigate-outline',
  'send': 'send-outline',
  'copy': 'copy-outline',
  'clipboard': 'clipboard-outline',
  'file': 'document-outline',
  'folder': 'folder-outline',
  'link': 'link-outline',
  'external-link': 'open-outline',
  'bookmark': 'bookmark-outline',
  'tag': 'pricetag-outline',
  'thumbs-up': 'thumbs-up-outline',
  'thumbs-down': 'thumbs-down-outline',
  'message-circle': 'chatbubble-outline',
  'message-square': 'chatbubble-outline',
  'mic': 'mic-outline',
  'mic-off': 'mic-off-outline',
  'video': 'videocam-outline',
  'video-off': 'videocam-off-outline',
  'shopping-cart': 'cart-outline',
  'shopping-bag': 'bag-outline',
  'gift': 'gift-outline',
  'award': 'trophy-outline',
  'target': 'radio-button-on-outline',
  'trending-up': 'trending-up-outline',
  'trending-down': 'trending-down-outline',
  'bar-chart': 'bar-chart-outline',
  'pie-chart': 'pie-chart-outline',
  'activity': 'pulse-outline',
  'zap': 'flash-outline',
  'sun': 'sunny-outline',
  'moon': 'moon-outline',
  'cloud': 'cloud-outline',
  'umbrella': 'umbrella-outline',
  'droplets': 'water-outline',
  'wind': 'leaf-outline'
};

export const FeatherIcon: React.FC<FeatherIconProps> = ({
  name,
  size = 24,
  color = '#000',
  style
}) => {
  const iconName = iconMap[name] || 'help-circle-outline';

  return (
    <Ionicons
      name={iconName}
      size={size}
      color={color}
      style={style}
    />
  );
};

export default FeatherIcon;