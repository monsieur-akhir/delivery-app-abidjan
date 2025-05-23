"use client"

import { useState } from "react"
import { View, StyleSheet, TouchableOpacity } from "react-native"
import { IconButton } from "react-native-paper"

const StarRating = ({ rating = 0, size = 24, disabled = false, onRatingChange }) => {
  const [currentRating, setCurrentRating] = useState(rating)

  const handlePress = (value) => {
    if (disabled) return

    setCurrentRating(value)

    if (onRatingChange) {
      onRatingChange(value)
    }
  }

  const renderStar = (position) => {
    const isFilled = position <= currentRating

    return (
      <TouchableOpacity
        key={position}
        onPress={() => handlePress(position)}
        disabled={disabled}
        style={styles.starContainer}
      >
        <IconButton
          icon={isFilled ? "star" : "star-outline"}
          size={size}
          color={isFilled ? "#FFC107" : "#BDBDBD"}
          style={styles.star}
        />
      </TouchableOpacity>
    )
  }

  return <View style={styles.container}>{[1, 2, 3, 4, 5].map((position) => renderStar(position))}</View>
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  starContainer: {
    padding: 0,
    margin: 0,
  },
  star: {
    margin: 0,
  },
})

export default StarRating
