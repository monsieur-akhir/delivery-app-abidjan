<template>
  <div class="line-chart-container">
    <canvas ref="chartCanvas"></canvas>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import Chart from 'chart.js/auto'

export default {
  name: 'LineChart',
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
          radius: 4,
          hoverRadius: 8,
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

      const mergedOptions = {
        ...defaultOptions,
        ...props.options,
      }

      chartInstance = new Chart(ctx, {
        type: 'line',
        data: props.data,
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
        chartInstance.data = props.data
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
.line-chart-container {
  position: relative;
  width: 100%;
  height: 400px;
}

canvas {
  width: 100% !important;
  height: 100% !important;
}
</style>
