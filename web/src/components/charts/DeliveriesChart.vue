<template>
  <div class="chart-container">
    <div class="chart-header">
      <h3>{{ title }}</h3>
      <div class="chart-actions">
        <button 
          class="btn-chart-action" 
          :class="{ active: chartType === 'line' }" 
          @click="changeChartType('line')"
          title="Graphique linéaire"
        >
          <font-awesome-icon icon="chart-line" />
        </button>
        <button 
          class="btn-chart-action" 
          :class="{ active: chartType === 'bar' }" 
          @click="changeChartType('bar')"
          title="Graphique à barres"
        >
          <font-awesome-icon icon="chart-bar" />
        </button>
      </div>
    </div>
    <div class="chart-content">
      <canvas ref="chartCanvas"></canvas>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, watch } from 'vue'

export default {
  name: 'DeliveriesChart',
  props: {
    chartData: {
      type: Object,
      required: true
    },
    title: {
      type: String,
      default: 'Graphique des livraisons'
    },
    options: {
      type: Object,
      default: () => ({})
    }
  },
  setup(props) {
    const chartType = ref('line')
    const chartCanvas = ref(null)
    let chartInstance = null

    const changeChartType = (type) => {
      chartType.value = type
      createChart()
    }

    const createChart = async () => {
      if (!chartCanvas.value) return

      // Détruire le graphique existant
      if (chartInstance) {
        chartInstance.destroy()
      }

      try {
        // Import dynamique de Chart.js
        const { Chart, registerables } = await import('chart.js')
        Chart.register(...registerables)

        const ctx = chartCanvas.value.getContext('2d')
        
        chartInstance = new Chart(ctx, {
          type: chartType.value,
          data: props.chartData,
          options: {
            responsive: true,
            maintainAspectRatio: false,
            ...props.options
          }
        })
      } catch (error) {
        console.error('Erreur lors de la création du graphique:', error)
      }
    }

    onMounted(() => {
      createChart()
    })

    onUnmounted(() => {
      if (chartInstance) {
        chartInstance.destroy()
      }
    })

    watch(() => props.chartData, () => {
      createChart()
    }, { deep: true })

    return {
      chartType,
      chartCanvas,
      changeChartType
    }
  }
}
</script>

<style scoped>
.chart-container {
  background-color: white;
  border-radius: 0.5rem;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  height: 100%;
  display: flex;
  flex-direction: column;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e9ecef;
}

.chart-header h3 {
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
  color: #333;
}

.chart-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-chart-action {
  width: 2rem;
  height: 2rem;
  border-radius: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: transparent;
  border: 1px solid #ced4da;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-chart-action:hover {
  background-color: #f8f9fa;
}

.btn-chart-action.active {
  background-color: #FF6B00;
  border-color: #FF6B00;
  color: white;
}

.chart-content {
  flex: 1;
  padding: 1rem;
  position: relative;
  min-height: 300px;
}

canvas {
  width: 100% !important;
  height: 100% !important;
}
</style>
