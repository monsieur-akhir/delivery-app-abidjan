import type React from "react"
import { View, StyleSheet, TouchableOpacity } from "react-native"
import { IconButton } from "react-native-paper"

interface StarRatingProps {
  rating: number
  size?: number
  color?: string
  inactiveColor?: string
  onRatingChange?: (rating: number) => void
}

const StarRating: React.FC<StarRatingProps> = ({
  rating,
  size = 24,
  color = "#FFC107",
  inactiveColor = "#E0E0E0",
  onRatingChange,
}) => {
  // Générer un tableau de 5 étoiles
  const stars = Array.from({ length: 5 }, (_, index) => index + 1)

  // Gérer le clic sur une étoile
  const handleStarPress = (selectedRating: number): void => {
    if (onRatingChange) {
      onRatingChange(selectedRating)
    }
  }

  return (
    <View style={styles.container}>
      {stars.map((star) => (
        <TouchableOpacity
          key={star}
          onPress={() => handleStarPress(star)}
          disabled={!onRatingChange}
          style={styles.starContainer}
        >
          <IconButton
            icon={star <= rating ? "star" : "star-outline"}
            size={size}
            color={star <= rating ? color : inactiveColor}
            style={styles.star}
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
  },
  star: {
    margin: 0,
  },
})

export default StarRating
