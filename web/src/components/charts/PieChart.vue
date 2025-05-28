<template>
  <div class="chart-container">
    <div class="chart-header">
      <h3>{{ chartData.title }}</h3>
      <div class="chart-actions" v-if="showActions">
        <button 
          class="btn-chart-action" 
          :class="{ active: chartType === 'pie' }" 
          @click="changeChartType('pie')"
          title="Graphique circulaire"
        >
          <font-awesome-icon icon="chart-pie" />
        </button>
        <button 
          class="btn-chart-action" 
          :class="{ active: chartType === 'doughnut' }" 
          @click="changeChartType('doughnut')"
          title="Graphique en anneau"
        >
          <font-awesome-icon icon="circle-notch" />
        </button>
      </div>
    </div>
    <div class="chart-content">
      <Pie :data="chartData" :options="options" />
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { Pie } from 'vue-chartjs'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

export default {
  name: 'PieChart',
  components: {
    Pie
  },
  props: {
    chartData: {
      type: Object,
      required: true
    },
    options: {
      type: Object,
      default: () => ({})
    },
    showActions: {
      type: Boolean,
      default: true
    }
  },
  setup(props, { emit }) {
    const chartType = ref(props.chartData.type || 'pie')
    const chart = ref(null)

    const createChart = () => {
      // Détruire le graphique existant s'il y en a un
      if (chart.value) {
        chart.value.destroy()
      }

      // Générer des couleurs si elles ne sont pas fournies
      const colors = props.chartData.colors || generatePaletteColors(props.chartData.datasets[0].data.length)
      
      // Appliquer les couleurs au dataset
      const chartDataCopy = JSON.parse(JSON.stringify(props.chartData));
      chartDataCopy.datasets[0].backgroundColor = colors;

      if (chartType.value === 'pie') {
        chart.value = new ChartJS(document.getElementById(props.chartData.chartId), {
          type: 'pie',
          data: chartDataCopy,
          options: props.options
        })
      } else {
        chart.value = new ChartJS(document.getElementById(props.chartData.chartId), {
          type: 'doughnut',
          data: chartDataCopy,
          options: props.options
        })
      }
    }

    const changeChartType = (type) => {
      chartType.value = type
      // On évite de modifier directement la prop
      createChart()
      emit('type-changed', type)
    }

    onMounted(() => {
      // Attendre que le DOM soit prêt
      setTimeout(() => {
        createChart()
      }, 100)
    })

    onUnmounted(() => {
      if (chart.value) {
        chart.value.destroy()
      }
    })

    // Surveiller les changements de données
    watch(() => props.chartData.datasets[0].data, () => {
      createChart()
    }, { deep: true })

    // Surveiller les changements d'étiquettes
    watch(() => props.chartData.labels, () => {
      createChart()
    }, { deep: true })

    return {
      chartType,
      changeChartType
    }
  }
}

function generatePaletteColors(length) {
  const colors = []
  for (let i = 0; i < length; i++) {
    colors.push(`hsl(${Math.floor(Math.random() * 360)}, 100%, 50%)`)
  }
  return colors
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
  position: relative;
  width: 100%;
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
  background-color: #0056b3;
  border-color: #0056b3;
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
