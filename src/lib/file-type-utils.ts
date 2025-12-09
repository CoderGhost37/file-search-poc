/**
 * File Type Utilities for Gemini File Search API
 * Maps MIME types to human-readable file type labels and categories
 */

export interface FileTypeInfo {
  label: string
  category: 'document' | 'data' | 'text' | 'code' | 'archive' | 'notebook' | 'image'
  color: string // Tailwind color classes
  extension: string
}

// Comprehensive MIME type to file type mapping
export const FILE_TYPE_MAP: Record<string, FileTypeInfo> = {
  // Documents
  'application/pdf': {
    label: 'PDF Document',
    category: 'document',
    color: 'text-red-600',
    extension: 'pdf',
  },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': {
    label: 'Word Document',
    category: 'document',
    color: 'text-blue-600',
    extension: 'docx',
  },
  'application/msword': {
    label: 'Word Document',
    category: 'document',
    color: 'text-blue-600',
    extension: 'doc',
  },
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
    label: 'Excel Spreadsheet',
    category: 'document',
    color: 'text-green-600',
    extension: 'xlsx',
  },
  'application/vnd.ms-excel': {
    label: 'Excel Spreadsheet',
    category: 'document',
    color: 'text-green-600',
    extension: 'xls',
  },
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': {
    label: 'PowerPoint Presentation',
    category: 'document',
    color: 'text-orange-600',
    extension: 'pptx',
  },
  'application/vnd.oasis.opendocument.text': {
    label: 'OpenDocument Text',
    category: 'document',
    color: 'text-blue-600',
    extension: 'odt',
  },

  // Data formats
  'application/json': {
    label: 'JSON',
    category: 'data',
    color: 'text-yellow-600',
    extension: 'json',
  },
  'application/xml': {
    label: 'XML',
    category: 'data',
    color: 'text-orange-600',
    extension: 'xml',
  },
  'text/xml': {
    label: 'XML',
    category: 'data',
    color: 'text-orange-600',
    extension: 'xml',
  },
  'text/csv': {
    label: 'CSV',
    category: 'data',
    color: 'text-green-600',
    extension: 'csv',
  },
  'text/tab-separated-values': {
    label: 'TSV',
    category: 'data',
    color: 'text-green-600',
    extension: 'tsv',
  },
  'application/x-yaml': {
    label: 'YAML',
    category: 'data',
    color: 'text-purple-600',
    extension: 'yaml',
  },
  'text/yaml': {
    label: 'YAML',
    category: 'data',
    color: 'text-purple-600',
    extension: 'yml',
  },

  // Text formats
  'text/plain': {
    label: 'Text File',
    category: 'text',
    color: 'text-gray-600',
    extension: 'txt',
  },
  'text/markdown': {
    label: 'Markdown',
    category: 'text',
    color: 'text-gray-600',
    extension: 'md',
  },
  'text/html': {
    label: 'HTML',
    category: 'text',
    color: 'text-orange-600',
    extension: 'html',
  },
  'text/rtf': {
    label: 'Rich Text',
    category: 'text',
    color: 'text-blue-600',
    extension: 'rtf',
  },

  // Code files - Programming Languages
  'text/x-python': {
    label: 'Python',
    category: 'code',
    color: 'text-blue-500',
    extension: 'py',
  },
  'text/javascript': {
    label: 'JavaScript',
    category: 'code',
    color: 'text-yellow-500',
    extension: 'js',
  },
  'application/javascript': {
    label: 'JavaScript',
    category: 'code',
    color: 'text-yellow-500',
    extension: 'js',
  },
  'text/typescript': {
    label: 'TypeScript',
    category: 'code',
    color: 'text-blue-600',
    extension: 'ts',
  },
  'application/typescript': {
    label: 'TypeScript',
    category: 'code',
    color: 'text-blue-600',
    extension: 'ts',
  },
  'text/x-java-source': {
    label: 'Java',
    category: 'code',
    color: 'text-red-600',
    extension: 'java',
  },
  'text/x-c': {
    label: 'C',
    category: 'code',
    color: 'text-blue-700',
    extension: 'c',
  },
  'text/x-c++': {
    label: 'C++',
    category: 'code',
    color: 'text-blue-700',
    extension: 'cpp',
  },
  'text/x-csharp': {
    label: 'C#',
    category: 'code',
    color: 'text-purple-600',
    extension: 'cs',
  },
  'text/x-go': {
    label: 'Go',
    category: 'code',
    color: 'text-cyan-600',
    extension: 'go',
  },
  'text/x-rust': {
    label: 'Rust',
    category: 'code',
    color: 'text-orange-700',
    extension: 'rs',
  },
  'text/x-ruby': {
    label: 'Ruby',
    category: 'code',
    color: 'text-red-500',
    extension: 'rb',
  },
  'text/x-php': {
    label: 'PHP',
    category: 'code',
    color: 'text-indigo-600',
    extension: 'php',
  },
  'text/x-kotlin': {
    label: 'Kotlin',
    category: 'code',
    color: 'text-purple-500',
    extension: 'kt',
  },
  'text/x-swift': {
    label: 'Swift',
    category: 'code',
    color: 'text-orange-600',
    extension: 'swift',
  },
  'text/x-dart': {
    label: 'Dart',
    category: 'code',
    color: 'text-blue-500',
    extension: 'dart',
  },
  'application/x-sh': {
    label: 'Shell Script',
    category: 'code',
    color: 'text-gray-700',
    extension: 'sh',
  },
  'text/x-shellscript': {
    label: 'Shell Script',
    category: 'code',
    color: 'text-gray-700',
    extension: 'sh',
  },

  // Archives
  'application/zip': {
    label: 'ZIP Archive',
    category: 'archive',
    color: 'text-yellow-700',
    extension: 'zip',
  },

  // Notebooks
  'application/x-ipynb+json': {
    label: 'Jupyter Notebook',
    category: 'notebook',
    color: 'text-orange-500',
    extension: 'ipynb',
  },

  // SQL
  'application/sql': {
    label: 'SQL',
    category: 'data',
    color: 'text-blue-600',
    extension: 'sql',
  },
  'text/x-sql': {
    label: 'SQL',
    category: 'data',
    color: 'text-blue-600',
    extension: 'sql',
  },

  // Images
  'image/png': {
    label: 'PNG Image',
    category: 'image',
    color: 'text-pink-600',
    extension: 'png',
  },
  'image/jpeg': {
    label: 'JPEG Image',
    category: 'image',
    color: 'text-pink-600',
    extension: 'jpg',
  },
  'image/jpg': {
    label: 'JPG Image',
    category: 'image',
    color: 'text-pink-600',
    extension: 'jpg',
  },
  'image/webp': {
    label: 'WebP Image',
    category: 'image',
    color: 'text-pink-600',
    extension: 'webp',
  },
  'image/gif': {
    label: 'GIF Image',
    category: 'image',
    color: 'text-pink-600',
    extension: 'gif',
  },
  'image/svg+xml': {
    label: 'SVG Image',
    category: 'image',
    color: 'text-pink-600',
    extension: 'svg',
  },
  'image/bmp': {
    label: 'BMP Image',
    category: 'image',
    color: 'text-pink-600',
    extension: 'bmp',
  },
  'image/tiff': {
    label: 'TIFF Image',
    category: 'image',
    color: 'text-pink-600',
    extension: 'tiff',
  },
  'image/heic': {
    label: 'HEIC Image',
    category: 'image',
    color: 'text-pink-600',
    extension: 'heic',
  },
  'image/heif': {
    label: 'HEIF Image',
    category: 'image',
    color: 'text-pink-600',
    extension: 'heif',
  },
}

/**
 * Get file type information from MIME type
 */
export function getFileTypeInfo(mimeType: string): FileTypeInfo {
  return (
    FILE_TYPE_MAP[mimeType] || {
      label: 'Unknown',
      category: 'document',
      color: 'text-gray-600',
      extension: 'file',
    }
  )
}

/**
 * Get file type information from file extension
 */
export function getFileTypeInfoFromExtension(filename: string): FileTypeInfo {
  const extension = filename.split('.').pop()?.toLowerCase() || ''

  // Find MIME type that matches the extension
  const entry = Object.entries(FILE_TYPE_MAP).find(
    ([_, info]) => info.extension === extension
  )

  if (entry) {
    return entry[1]
  }

  // Fallback based on extension
  return {
    label: extension.toUpperCase(),
    category: 'document',
    color: 'text-gray-600',
    extension,
  }
}

/**
 * Get category badge color
 */
export function getCategoryColor(category: FileTypeInfo['category']): string {
  const colors = {
    document: 'bg-blue-100 text-blue-800 border-blue-300',
    data: 'bg-green-100 text-green-800 border-green-300',
    text: 'bg-gray-100 text-gray-800 border-gray-300',
    code: 'bg-purple-100 text-purple-800 border-purple-300',
    archive: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    notebook: 'bg-orange-100 text-orange-800 border-orange-300',
    image: 'bg-pink-100 text-pink-800 border-pink-300',
  }

  return colors[category]
}