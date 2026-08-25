import type { DataTableColumn } from '@/components/ui/data-table'

/**
 * Formate les données pour l'export en appliquant les formatters de colonnes si présents
 */
export function formatDataForExport<T extends Record<string, unknown>>(
  data: T[],
  columns: DataTableColumn<T>[]
): Record<string, unknown>[] {
  return data.map((item) => {
    const row: Record<string, unknown> = {}
    columns.forEach((col) => {
      const rawValue = item[col.key]
      if (col.formatter) {
        row[col.label || col.key] = col.formatter(rawValue, item)
      } else if (rawValue === null || rawValue === undefined) {
        row[col.label || col.key] = ''
      } else if (typeof rawValue === 'boolean') {
        row[col.label || col.key] = rawValue ? 'Oui' : 'Non'
      } else if (Array.isArray(rawValue)) {
        row[col.label || col.key] = rawValue.join(', ')
      } else if (typeof rawValue === 'object') {
        row[col.label || col.key] = JSON.stringify(rawValue)
      } else {
        row[col.label || col.key] = rawValue
      }
    })
    return row
  })
}

/**
 * Échappe et assainit une valeur pour le format CSV (RFC 4180 + Prévention CWE-1236 Formula Injection)
 */
export function escapeCsvValue(val: unknown): string {
  if (val === null || val === undefined) return ''
  let str = String(val)

  // Mitigation Formula / CSV Injection (OWASP & CWE-1236)
  const dangerousPrefixes = ['=', '+', '-', '@', '\t', '\r']
  if (dangerousPrefixes.some((prefix) => str.startsWith(prefix))) {
    str = `'${str}`
  }

  if (
    str.includes('"') ||
    str.includes(',') ||
    str.includes(';') ||
    str.includes('\n') ||
    str.includes('\r')
  ) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

/**
 * Exporte les données au format CSV avec encodage UTF-8 BOM (compatible Excel & LibreOffice)
 */
export function exportToCsv<T extends Record<string, unknown>>(
  data: T[],
  columns: DataTableColumn<T>[],
  filename: string = 'export-donnees'
): void {
  const formattedData = formatDataForExport(data, columns)
  const headers = columns.map((col) => escapeCsvValue(col.label || col.key)).join(';')

  const rows = formattedData.map((row) => {
    return columns.map((col) => escapeCsvValue(row[col.label || col.key])).join(';')
  })

  const csvContent = [headers, ...rows].join('\r\n')
  // Ajout du BOM UTF-8 (\uFEFF) pour compatibilité Excel
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
  downloadBlob(blob, `${filename.replace(/\.csv$/i, '')}.csv`)
}

/**
 * Exporte les données au format JSON structuré
 */
export function exportToJson<T extends Record<string, unknown>>(
  data: T[],
  columns: DataTableColumn<T>[],
  filename: string = 'export-donnees'
): void {
  const formattedData = formatDataForExport(data, columns)
  const jsonContent = JSON.stringify(formattedData, null, 2)
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' })
  downloadBlob(blob, `${filename.replace(/\.json$/i, '')}.json`)
}

/**
 * Déclenche le téléchargement du Blob dans le navigateur
 */
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
