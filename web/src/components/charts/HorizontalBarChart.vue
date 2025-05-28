<!-- eslint-disable prettier/prettier -->
<template>
  <div class="chart-container">
    <div class="chart-header">
      <h3>{{ chartData.title }}</h3>
    </div>
    <div class="chart-content">
      <Bar :data="chartData" :options="options" />
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { Bar } from 'vue-chartjs';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default {
  name: 'HorizontalBarChart',
  components: {
    Bar
  },
  props: {
    chartData: {
      type: Object,
      required: true
    },
    options: {
      type: Object,
      default: () => ({})
    }
  },
  setup(props) {
    const chart = ref(null)

    const createChart = () => {
      // Détruire le graphique existant s'il y en a un
      if (chart.value) {
        chart.value.destroy()
      }

      chart.value = new ChartJS(document.getElementById(props.chartData.chartId), {
        type: 'bar',
        data: props.chartData,
        options: props.options
      })
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
    watch(() => props.chartData.data, () => {
      createChart()
    }, { deep: true })

    // Surveiller les changements d'étiquettes
    watch(() => props.chartData.labels, () => {
      createChart()
    }, { deep: true })

    return {}
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
