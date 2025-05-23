/**
 * Exporter des données au format CSV
 * @param {Array} data - Données à exporter
 * @param {Array} headers - En-têtes des colonnes
 * @param {string} filename - Nom du fichier
 */
export const exportToCSV = (data, headers, filename) => {
  // Créer les en-têtes CSV
  const headerRow = headers.map((header) => `"${header.label}"`).join(",")

  // Créer les lignes de données
  const rows = data.map((item) => {
    return headers
      .map((header) => {
        const value = item[header.key]
        // Échapper les guillemets et entourer de guillemets
        return `"${String(value).replace(/"/g, '""')}"`
      })
      .join(",")
  })

  // Combiner les en-têtes et les lignes
  const csv = [headerRow, ...rows].join("\n")

  // Créer un blob et télécharger
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  downloadBlob(blob, filename)
}

/**
 * Exporter des données au format Excel (XLSX)
 * @param {Array} data - Données à exporter
 * @param {Array} headers - En-têtes des colonnes
 * @param {string} filename - Nom du fichier
 */
export const exportToExcel = async (data, headers, filename) => {
  try {
    // Importer dynamiquement la bibliothèque xlsx
    const XLSX = await import("xlsx")

    // Préparer les données pour xlsx
    const worksheet = XLSX.utils.json_to_sheet(
      data.map((item) => {
        const row = {}
        headers.forEach((header) => {
          row[header.label] = item[header.key]
        })
        return row
      }),
    )

    // Créer un classeur et ajouter la feuille
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1")

    // Générer le fichier et télécharger
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" })
    const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
    downloadBlob(blob, filename)
  } catch (error) {
    console.error("Error exporting to Excel:", error)
    throw new Error("Erreur lors de l'exportation en Excel. Vérifiez que la bibliothèque xlsx est installée.")
  }
}

/**
 * Exporter des données au format PDF
 * @param {Array} data - Données à exporter
 * @param {Array} columns - Définition des colonnes
 * @param {Object} options - Options d'exportation
 */
export const exportToPDF = async (data, columns, options = {}) => {
  try {
    // Importer dynamiquement la bibliothèque jspdf et jspdf-autotable
    const { jsPDF } = await import("jspdf")
    const { default: autoTable } = await import("jspdf-autotable")

    // Créer un nouveau document PDF
    const orientation = options.pageOrientation || "portrait"
    const doc = new jsPDF({
      orientation,
      unit: "mm",
      format: "a4",
    })

    // Ajouter un titre si spécifié
    if (options.title) {
      doc.setFontSize(16)
      doc.text(options.title, 14, 15)
      doc.setFontSize(10)
      doc.text(`Généré le ${new Date().toLocaleDateString()}`, 14, 22)
      doc.line(14, 25, doc.internal.pageSize.getWidth() - 14, 25)
    }

    // Générer le tableau
    autoTable(doc, {
      startY: options.title ? 30 : 14,
      head: [columns.map((col) => col.header)],
      body: data.map((item) => columns.map((col) => item[col.dataKey])),
      theme: "grid",
      headStyles: {
        fillColor: [67, 97, 238],
        textColor: 255,
        fontStyle: "bold",
      },
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
      columnStyles: options.columnStyles || {},
    })

    // Télécharger le PDF
    doc.save(options.fileName || "export.pdf")
  } catch (error) {
    console.error("Error exporting to PDF:", error)
    throw new Error(
      "Erreur lors de l'exportation en PDF. Vérifiez que les bibliothèques jspdf et jspdf-autotable sont installées.",
    )
  }
}

/**
 * Imprimer un élément DOM
 * @param {HTMLElement} element - Élément à imprimer
 */
export const printElement = (element) => {
  // Créer une fenêtre d'impression
  const printWindow = window.open("", "_blank")

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
  const link = document.createElement("a")
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
