import Chart from "chart.js/auto"

/**
 * Crée un graphique linéaire
 * @param {string} canvasId - ID de l'élément canvas
 * @param {Array} labels - Étiquettes pour l'axe X
 * @param {Array} datasets - Ensembles de données
 * @param {Object} options - Options du graphique
 * @returns {Object} L'instance du graphique
 */
export const createLineChart = (canvasId, labels, datasets, options = {}) => {
  const canvas = document.getElementById(canvasId)
  if (!canvas) return null

  const ctx = canvas.getContext("2d")

  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
      },
      tooltip: {
        mode: "index",
        intersect: false,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: "rgba(0, 0, 0, 0.05)",
        },
      },
    },
  }

  const chartOptions = { ...defaultOptions, ...options }

  return new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets,
    },
    options: chartOptions,
  })
}

/**
 * Crée un graphique à barres
 * @param {string} canvasId - ID de l'élément canvas
 * @param {Array} labels - Étiquettes pour l'axe X
 * @param {Array} datasets - Ensembles de données
 * @param {Object} options - Options du graphique
 * @returns {Object} L'instance du graphique
 */
export const createBarChart = (canvasId, labels, datasets, options = {}) => {
  const canvas = document.getElementById(canvasId)
  if (!canvas) return null

  const ctx = canvas.getContext("2d")

  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
      },
      tooltip: {
        mode: "index",
        intersect: false,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: "rgba(0, 0, 0, 0.05)",
        },
      },
    },
  }

  const chartOptions = { ...defaultOptions, ...options }

  return new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets,
    },
    options: chartOptions,
  })
}

/**
 * Crée un graphique à barres horizontales
 * @param {string} canvasId - ID de l'élément canvas
 * @param {Array} labels - Étiquettes pour l'axe Y
 * @param {Array} datasets - Ensembles de données
 * @param {Object} options - Options du graphique
 * @returns {Object} L'instance du graphique
 */
export const createHorizontalBarChart = (canvasId, labels, datasets, options = {}) => {
  const canvas = document.getElementById(canvasId)
  if (!canvas) return null

  const ctx = canvas.getContext("2d")

  const defaultOptions = {
    indexAxis: "y",
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
      },
      tooltip: {
        mode: "index",
        intersect: false,
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        grid: {
          color: "rgba(0, 0, 0, 0.05)",
        },
      },
      y: {
        grid: {
          display: false,
        },
      },
    },
  }

  const chartOptions = { ...defaultOptions, ...options }

  return new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets,
    },
    options: chartOptions,
  })
}

/**
 * Crée un graphique circulaire
 * @param {string} canvasId - ID de l'élément canvas
 * @param {Array} labels - Étiquettes
 * @param {Array} data - Données
 * @param {Array} backgroundColor - Couleurs d'arrière-plan
 * @param {Object} options - Options du graphique
 * @returns {Object} L'instance du graphique
 */
export const createPieChart = (canvasId, labels, data, backgroundColor, options = {}) => {
  const canvas = document.getElementById(canvasId)
  if (!canvas) return null

  const ctx = canvas.getContext("2d")

  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "right",
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.label || ""
            const value = context.raw || 0
            const total = context.chart.data.datasets[0].data.reduce((a, b) => a + b, 0)
            const percentage = Math.round((value / total) * 100)
            return `${label}: ${value} (${percentage}%)`
          },
        },
      },
    },
  }

  const chartOptions = { ...defaultOptions, ...options }

  return new Chart(ctx, {
    type: "pie",
    data: {
      labels,
      datasets: [
        {
          data,
          backgroundColor,
          borderWidth: 1,
          borderColor: "#fff",
        },
      ],
    },
    options: chartOptions,
  })
}

/**
 * Crée un graphique en anneau
 * @param {string} canvasId - ID de l'élément canvas
 * @param {Array} labels - Étiquettes
 * @param {Array} data - Données
 * @param {Array} backgroundColor - Couleurs d'arrière-plan
 * @param {Object} options - Options du graphique
 * @returns {Object} L'instance du graphique
 */
export const createDoughnutChart = (canvasId, labels, data, backgroundColor, options = {}) => {
  const canvas = document.getElementById(canvasId)
  if (!canvas) return null

  const ctx = canvas.getContext("2d")

  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "70%",
    plugins: {
      legend: {
        position: "right",
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.label || ""
            const value = context.raw || 0
            const total = context.chart.data.datasets[0].data.reduce((a, b) => a + b, 0)
            const percentage = Math.round((value / total) * 100)
            return `${label}: ${value} (${percentage}%)`
          },
        },
      },
    },
  }

  const chartOptions = { ...defaultOptions, ...options }

  return new Chart(ctx, {
    type: "doughnut",
    data: {
      labels,
      datasets: [
        {
          data,
          backgroundColor,
          borderWidth: 1,
          borderColor: "#fff",
        },
      ],
    },
    options: chartOptions,
  })
}

/**
 * Met à jour les données d'un graphique
 * @param {Object} chart - L'instance du graphique
 * @param {Array} labels - Nouvelles étiquettes
 * @param {Array} datasets - Nouveaux ensembles de données
 */
export const updateChartData = (chart, labels, datasets) => {
  if (!chart) return

  chart.data.labels = labels
  chart.data.datasets = datasets
  chart.update()
}

/**
 * Met à jour les données d'un graphique circulaire ou en anneau
 * @param {Object} chart - L'instance du graphique
 * @param {Array} labels - Nouvelles étiquettes
 * @param {Array} data - Nouvelles données
 * @param {Array} backgroundColor - Nouvelles couleurs d'arrière-plan
 */
export const updatePieChartData = (chart, labels, data, backgroundColor) => {
  if (!chart) return

  chart.data.labels = labels
  chart.data.datasets[0].data = data
  if (backgroundColor) {
    chart.data.datasets[0].backgroundColor = backgroundColor
  }
  chart.update()
}

/**
 * Génère des couleurs aléatoires pour les graphiques
 * @param {number} count - Nombre de couleurs à générer
 * @returns {Array} Tableau de couleurs au format hexadécimal
 */
export function generateChartColors(count) {
  const colors = [
    "#4CAF50", // Vert
    "#2196F3", // Bleu
    "#FF9800", // Orange
    "#F44336", // Rouge
    "#9C27B0", // Violet
    "#00BCD4", // Cyan
    "#FFEB3B", // Jaune
    "#795548", // Marron
    "#607D8B", // Bleu-gris
    "#E91E63", // Rose
  ]

  // Si nous avons besoin de plus de couleurs que celles prédéfinies
  if (count > colors.length) {
    for (let i = colors.length; i < count; i++) {
      // Générer une couleur aléatoire
      const randomColor =
        "#" +
        Math.floor(Math.random() * 16777215)
          .toString(16)
          .padStart(6, "0")
      colors.push(randomColor)
    }
  }

  return colors.slice(0, count)
}

/**
 * Formate les données pour un graphique en ligne
 * @param {Array} data - Données brutes
 * @param {string} labelKey - Clé pour les libellés
 * @param {string} valueKey - Clé pour les valeurs
 * @returns {Object} Données formatées pour Chart.js
 */
export function formatLineChartData(data, labelKey, valueKey) {
  return {
    labels: data.map((item) => item[labelKey]),
    datasets: [
      {
        data: data.map((item) => item[valueKey]),
        backgroundColor: "#4CAF50",
        borderColor: "#4CAF50",
        borderWidth: 2,
        tension: 0.4,
        fill: false,
      },
    ],
  }
}

/**
 * Formate les données pour un graphique en camembert
 * @param {Array} data - Données brutes
 * @param {string} labelKey - Clé pour les libellés
 * @param {string} valueKey - Clé pour les valeurs
 * @returns {Object} Données formatées pour Chart.js
 */
export function formatPieChartData(data, labelKey, valueKey) {
  const labels = data.map((item) => item[labelKey])
  return {
    labels: labels,
    datasets: [
      {
        data: data.map((item) => item[valueKey]),
        backgroundColor: generateChartColors(labels.length),
        borderWidth: 1,
      },
    ],
  }
}

/**
 * Formate les données pour un graphique en barres
 * @param {Array} data - Données brutes
 * @param {string} labelKey - Clé pour les libellés
 * @param {string} valueKey - Clé pour les valeurs
 * @param {string} color - Couleur des barres (optionnel)
 * @returns {Object} Données formatées pour Chart.js
 */
export function formatBarChartData(data, labelKey, valueKey, color = "#2196F3") {
  return {
    labels: data.map((item) => item[labelKey]),
    datasets: [
      {
        label: "Valeur",
        data: data.map((item) => item[valueKey]),
        backgroundColor: color,
        borderColor: color,
        borderWidth: 1,
      },
    ],
  }
}

/**
 * Détruit un graphique
 * @param {Object} chart - L'instance du graphique à détruire
 */
export const destroyChart = (chart) => {
  if (chart) {
    chart.destroy()
  }
}
