<template>
  <div class="chart-container">
    <div class="chart-header">
      <h3>{{ chartData.datasets[0].label }}</h3>
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
      <Line v-if="chartType === 'line'" :data="chartData" :options="options" />
      <Bar v-else :data="chartData" :options="options" />
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { Line, Bar } from 'vue-chartjs';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

export default {
  name: 'DeliveriesChart',
  components: {
    Line,
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
    const chartType = ref('line');

    const changeChartType = (type) => {
      chartType.value = type;
    }

    return {
      chartType,
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
