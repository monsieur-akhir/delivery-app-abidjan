
import React from 'react'
import { View, TouchableOpacity, StyleSheet } from 'react-native'
import { Feather } from '@expo/vector-icons'

export interface StarRatingProps {
  rating: number
  onRatingChange?: (rating: number) => void
  maxRating?: number
  starSize?: number
  size?: number
  disabled?: boolean
  readonly?: boolean
  editable?: boolean
}

const StarRating: React.FC<StarRatingProps> = ({
  rating,
  onRatingChange,
  maxRating = 5,
  starSize = 24,
  size,
  disabled = false,
  readonly = false,
  editable = false,
}) => {
  const finalSize = size || starSize
  const handleStarPress = (selectedRating: number) => {
    if (!disabled && !readonly && onRatingChange) {
      onRatingChange(selectedRating)
    }
  }

  const renderStar = (index: number) => {
    const isFilled = index < rating
    const isInteractive = !disabled && !readonly && onRatingChange

    if (isInteractive) {
      return (
        <TouchableOpacity
          key={index}
          style={styles.star}
          onPress={() => handleStarPress(index + 1)}
          disabled={disabled}
        >
          <Feather
            name="star"
            size={finalSize}
            color={isFilled ? '#FFD700' : '#E0E0E0'}
            style={isFilled ? styles.filledStar : styles.emptyStar}
          />
        </TouchableOpacity>
      )
    }

    return (
      <View key={index} style={styles.star}>
        <Feather
          name="star"
          size={finalSize}
          color={isFilled ? '#FFD700' : '#E0E0E0'}
          style={isFilled ? styles.filledStar : styles.emptyStar}
        />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {Array.from({ length: maxRating }, (_, index) => renderStar(index))}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  star: {
    marginHorizontal: 2,
  },
  filledStar: {
    color: '#FFD700',
  },
  emptyStar: {
    color: '#E0E0E0',
  },
})

export default StarRating
