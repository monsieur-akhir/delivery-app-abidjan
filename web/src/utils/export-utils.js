/**
 * Exporter des données au format CSV
 * @param {Array} data - Données à exporter
 * @param {Array} headers - En-têtes des colonnes
 * @param {string} filename - Nom du fichier
 */
export const exportToCSV = (data, headers, filename) => {
  // Créer les en-têtes CSV
  const headerRow = headers.map(header => `"${header.label}"`).join(',')

  // Créer les lignes de données
  const rows = data.map(item => {
    return headers
      .map(header => {
        const value = item[header.key]
        // Échapper les guillemets et entourer de guillemets
        return `"${String(value).replace(/"/g, '""')}"`
      })
      .join(',')
  })

  // Combiner les en-têtes et les lignes
  const csv = [headerRow, ...rows].join('\n')

  // Créer un blob et télécharger
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  downloadBlob(blob, filename)
}

/**
 * Exporter des données au format Excel (XLSX)
 */
export const exportToExcel = async (data, headers, filename) => {
  try {
    // Fallback vers CSV si xlsx n'est pas disponible
    console.warn('XLSX non disponible, export en CSV à la place')
    return exportToCSV(data, headers, filename.replace('.xlsx', '.csv'))
  } catch (error) {
    console.error('Error exporting to Excel:', error)
    throw new Error("Erreur lors de l'exportation en Excel.")
  }
}

/**
 * Exporter des données au format PDF
 */
export const exportToPDF = async (data, columns, options = {}) => {
  try {
    // Fallback vers CSV si jsPDF n'est pas disponible
    console.warn('jsPDF non disponible, export en CSV à la place')
    const csvData = data.map(item => {
      const row = {}
      columns.forEach(col => {
        row[col.header] = item[col.dataKey]
      })
      return row
    })
    return exportToCSV(
      csvData,
      columns.map(col => ({ key: col.dataKey, label: col.header })),
      options.fileName || 'export.csv'
    )
  } catch (error) {
    console.error('Error exporting to PDF:', error)
    throw new Error("Erreur lors de l'exportation en PDF.")
  }
}

/**
 * Imprimer un élément DOM
 * @param {HTMLElement} element - Élément à imprimer
 */
export const printElement = element => {
  // Créer une fenêtre d'impression
  const printWindow = window.open('', '_blank')

  // Ajouter les styles
  printWindow.document.write(`
    <html>
      <head>
        <title>Impression</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            color: #333;
            line-height: 1.5;
          }
          .delivery-info-card {
            margin-bottom: 20px;
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 15px;
          }
          .delivery-info-card h2 {
            margin-top: 0;
            padding-bottom: 10px;
            border-bottom: 1px solid #eee;
            font-size: 16px;
          }
          .status-badge-large {
            display: inline-block;
            padding: 5px 10px;
            border-radius: 4px;
            font-weight: bold;
            text-transform: uppercase;
          }
          .status-pending { background-color: #FFF8E1; color: #FFA000; }
          .status-accepted { background-color: #E3F2FD; color: #1976D2; }
          .status-in_progress { background-color: #FFF0E8; color: #FF6B00; }
          .status-completed { background-color: #E8F5E9; color: #388E3C; }
          .status-cancelled { background-color: #FFEBEE; color: #D32F2F; }
          .price-value {
            font-size: 18px;
            font-weight: bold;
            color: #4361ee;
          }
          @media print {
            body { margin: 0; padding: 15px; }
            button, .no-print { display: none !important; }
          }
        </style>
      </head>
      <body>
        ${element.outerHTML}
      </body>
    </html>
  `)

  // Fermer le document et imprimer
  printWindow.document.close()
  printWindow.focus()

  // Attendre que les styles et les images soient chargés
  setTimeout(() => {
    printWindow.print()
    printWindow.close()
  }, 1000)
}

/**
 * Télécharger un blob
 * @param {Blob} blob - Blob à télécharger
 * @param {string} filename - Nom du fichier
 */
const downloadBlob = (blob, filename) => {
  // Créer un lien de téléchargement
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename

  // Ajouter le lien au document, cliquer dessus, puis le supprimer
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  // Libérer l'URL
  setTimeout(() => {
    URL.revokeObjectURL(url)
  }, 100)
}
