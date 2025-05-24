import type React from "react"
import { View, StyleSheet, TouchableOpacity } from "react-native"
import { Feather } from "@expo/vector-icons"

export interface StarRatingProps {
  rating: number
  size?: number
  color?: string
  inactiveColor?: string
  onRatingChange?: (rating: number) => void
  editable?: boolean
}

const StarRating: React.FC<StarRatingProps> = ({
  rating,
  size = 24,
  color = "#FFC107",
  inactiveColor = "#E0E0E0",
  onRatingChange,
  editable = false,
}) => {
  // Generate an array of 5 stars
  const stars = Array.from({ length: 5 }, (_, index) => index + 1)

  // Handle click on a star
  const handleStarPress = (selectedRating: number): void => {
    if (editable && onRatingChange) {
      onRatingChange(selectedRating)
    }
  }

  return (
    <View style={styles.container}>
      {stars.map((star) => (
        <TouchableOpacity
          key={star}
          onPress={() => handleStarPress(star)}
          disabled={!editable || !onRatingChange}
          style={styles.starContainer}
        >
          <Feather
            name={star <= rating ? "star" : "star"}
            size={size}
            style={{ color: star <= rating ? color : inactiveColor, margin: 0 }}
          />
        </TouchableOpacity>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
  },
  starContainer: {
    padding: 0,
    margin: 0,
  },
})

export default StarRating
