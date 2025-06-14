<template>
  <div class="area-chart-container">
    <canvas ref="chartCanvas"></canvas>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import Chart from 'chart.js/auto'

export default {
  name: 'AreaChart',
  props: {
    data: {
      type: Object,
      required: true,
    },
    options: {
      type: Object,
      default: () => ({}),
    },
    height: {
      type: Number,
      default: 400,
    },
  },
  setup(props) {
    const chartCanvas = ref(null)
    let chartInstance = null

    const defaultOptions = {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        intersect: false,
        mode: 'index',
      },
      scales: {
        x: {
          display: true,
          grid: {
            display: false,
          },
        },
        y: {
          display: true,
          beginAtZero: true,
          grid: {
            color: 'rgba(0, 0, 0, 0.1)',
          },
        },
      },
      elements: {
        point: {
          radius: 0,
          hoverRadius: 6,
        },
        line: {
          tension: 0.4,
        },
      },
      plugins: {
        legend: {
          display: true,
          position: 'top',
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: 'white',
          bodyColor: 'white',
          borderColor: 'white',
          borderWidth: 1,
        },
      },
    }

    const createChart = () => {
      if (!chartCanvas.value) return

      const ctx = chartCanvas.value.getContext('2d')

      // Préparer les données avec fill pour l'effet d'aire
      const chartData = {
        ...props.data,
        datasets: props.data.datasets.map((dataset, index) => ({
          ...dataset,
          fill: true,
          backgroundColor: dataset.backgroundColor || `rgba(54, 162, 235, 0.2)`,
          borderColor: dataset.borderColor || `rgba(54, 162, 235, 1)`,
          pointBackgroundColor:
            dataset.pointBackgroundColor || dataset.borderColor || `rgba(54, 162, 235, 1)`,
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
        })),
      }

      const mergedOptions = {
        ...defaultOptions,
        ...props.options,
      }

      chartInstance = new Chart(ctx, {
        type: 'line',
        data: chartData,
        options: mergedOptions,
      })
    }

    const destroyChart = () => {
      if (chartInstance) {
        chartInstance.destroy()
        chartInstance = null
      }
    }

    const updateChart = () => {
      if (chartInstance) {
        chartInstance.data = {
          ...props.data,
          labels: chartData.labels,
          datasets: chartData.datasets.map(dataset => ({
            ...dataset,
            fill: true,
            backgroundColor: dataset.backgroundColor || `rgba(54, 162, 235, 0.2)`,
            borderColor: dataset.borderColor || `rgba(54, 162, 235, 1)`,
          })),
        }
        chartInstance.update()
      }
    }

    onMounted(() => {
      createChart()
    })

    onUnmounted(() => {
      destroyChart()
    })

    watch(
      () => props.data,
      () => {
        updateChart()
      },
      { deep: true }
    )

    return {
      chartCanvas,
    }
  },
}
</script>

<style scoped>
.area-chart-container {
  position: relative;
  width: 100%;
  height: 400px;
}

canvas {
  width: 100% !important;
  height: 100% !important;
}
</style>
