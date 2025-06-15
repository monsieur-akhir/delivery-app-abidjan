import React from 'react'
import { Feather } from '@expo/vector-icons'

// Valid Feather icon names
export type FeatherIconName = 
  | 'home' | 'user' | 'settings' | 'bell' | 'search' | 'menu' | 'chevron-right'
  | 'chevron-left' | 'chevron-up' | 'chevron-down' | 'plus' | 'minus' | 'x'
  | 'check' | 'star' | 'heart' | 'eye' | 'eye-off' | 'edit' | 'trash'
  | 'save' | 'download' | 'share' | 'copy' | 'link' | 'external-link'
  | 'mail' | 'phone' | 'message-circle' | 'send' | 'paperclip'
  | 'camera' | 'image' | 'video' | 'music' | 'file' | 'folder'
  | 'map-pin' | 'navigation' | 'compass' | 'clock' | 'calendar'
  | 'dollar-sign' | 'credit-card' | 'shopping-cart' | 'package' | 'truck'
  | 'car' | 'bicycle' | 'motorcycle' | 'user-plus' | 'users' | 'shield'
  | 'lock' | 'unlock' | 'key' | 'refresh-cw' | 'loader' | 'alert-circle'
  | 'info' | 'help-circle' | 'more-horizontal' | 'more-vertical'
  | 'filter' | 'grid' | 'list' | 'bar-chart' | 'pie-chart' | 'trending-up'
  | 'wifi' | 'wifi-off' | 'battery' | 'bluetooth' | 'headphones'
  | 'volume-2' | 'volume-x' | 'play' | 'pause' | 'skip-back' | 'skip-forward'
  | 'fast-forward' | 'rewind' | 'repeat' | 'shuffle' | 'maximize'
  | 'minimize' | 'square' | 'circle' | 'triangle'

interface FeatherIconProps {
  name: FeatherIconName
  size?: number
  color?: string
  style?: any
}

export const FeatherIcon: React.FC<FeatherIconProps> = ({
  name,
  size = 24,
  color = '#000',
  style,
}) => {
  return (
    <Feather
      name={name}
      size={size}
      color={color}
      style={style}
    />
  )
}

export default FeatherIcon