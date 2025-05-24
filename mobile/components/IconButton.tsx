import { TouchableOpacity, StyleSheet } from "react-native"
import { Feather } from "@expo/vector-icons"

interface IconButtonProps {
  icon: string
  size?: number
  color?: string
  onPress?: () => void
  style?: any
}

const IconButton = ({ icon, size = 24, color = "#000000", onPress, style }: IconButtonProps) => {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.container, style]} disabled={!onPress}>
      <Feather name={icon} size={size} color={color} />
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 8,
  },
})

export default IconButton
