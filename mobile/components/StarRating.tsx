
import React from 'react'
import { View, TouchableOpacity, StyleSheet } from 'react-native'
import { Feather } from '@expo/vector-icons'

export interface StarRatingProps {
  rating: number
  onRatingChange?: (rating: number) => void
  maxRating?: number
  starSize?: number
  disabled?: boolean
  readonly?: boolean
}

const StarRating: React.FC<StarRatingProps> = ({
  rating,
  onRatingChange,
  maxRating = 5,
  starSize = 24,
  disabled = false,
  readonly = false,
}) => {
  const handleStarPress = (selectedRating: number) => {
    if (!disabled && !readonly && onRatingChange) {
      onRatingChange(selectedRating)
    }
  }

  const renderStar = (index: number) => {
    const isFilled = index < rating
    const isInteractive = !disabled && !readonly && onRatingChange

    const StarComponent = isInteractive ? TouchableOpacity : View

    return (
      <StarComponent
        key={index}
        style={styles.star}
        onPress={isInteractive ? () => handleStarPress(index + 1) : undefined}
        disabled={disabled}
      >
        <Feather
          name={isFilled ? 'star' : 'star'}
          size={starSize}
          color={isFilled ? '#FFD700' : '#E0E0E0'}
          style={isFilled ? styles.filledStar : styles.emptyStar}
        />
      </StarComponent>
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
