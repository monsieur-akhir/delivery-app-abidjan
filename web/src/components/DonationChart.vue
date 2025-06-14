<template>
  <div class="donation-chart">
    <div class="chart-container" ref="chartContainer">
      <canvas ref="chartCanvas"></canvas>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, watch } from 'vue'
import Chart from 'chart.js/auto'

export default {
  name: 'DonationChart',
  props: {
    data: {
      type: Object,
      required: true,
    },
    type: {
      type: String,
      default: 'pie',
      validator: value => ['pie', 'doughnut', 'bar', 'line'].includes(value),
    },
    title: {
      type: String,
      default: '',
    },
  },
  setup(props) {
    const chartCanvas = ref(null)
    const chartContainer = ref(null)
    let chart = null

    const createChart = () => {
      if (!chartCanvas.value) return

      const ctx = chartCanvas.value.getContext('2d')

      // Détruire le graphique existant s'il y en a un
      if (chart) {
        chart.destroy()
      }

      // Configurer les options du graphique en fonction du type
      const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              usePointStyle: true,
              padding: 20,
            },
          },
          title: {
            display: !!props.title,
            text: props.title,
            font: {
              size: 16,
            },
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                let label = context.label || ''
                if (label) {
                  label += ': '
                }
                if (context.parsed !== undefined) {
                  label += new Intl.NumberFormat('fr-FR', {
                    style: 'currency',
                    currency: 'XOF',
                    minimumFractionDigits: 0,
                  }).format(context.parsed)
                }
                return label
              },
            },
          },
        },
      }

      // Créer le graphique
      chart = new Chart(ctx, {
        type: props.type,
        data: {
          labels: props.data.labels,
          datasets: [
            {
              label: props.data.label || 'Montant',
              data: props.data.values,
              backgroundColor: props.data.colors || [
                '#4e73df',
                '#1cc88a',
                '#36b9cc',
                '#f6c23e',
                '#e74a3b',
                '#6f42c1',
                '#fd7e14',
                '#20c997',
              ],
              borderWidth: 1,
            },
          ],
        },
        options: options,
      })
    }

    onMounted(() => {
      createChart()
    })

    watch(
      () => props.data,
      () => {
        createChart()
      },
      { deep: true }
    )

    watch(
      () => props.type,
      () => {
        createChart()
      }
    )

    return {
      chartCanvas,
      chartContainer,
    }
  },
}
</script>

<style scoped>
.donation-chart {
  width: 100%;
  height: 100%;
}

.chart-container {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 300px;
}
</style>
