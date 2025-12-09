import { randomUUID } from 'node:crypto'
import { promises as fs } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { GoogleGenAI } from '@google/genai'
import { revalidatePath } from 'next/cache'
import { type NextRequest, NextResponse } from 'next/server'
import { getFileSearchStore } from '@/app/actions'
import { addFileToDb } from '@/lib/db'
import { FileUploadError, getUserFriendlyErrorMessage, logError, ValidationError } from '@/lib/errors'

const IMAGE_MIME_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/gif',
  'image/bmp',
  'image/tiff',
  'image/svg+xml',
  'image/heic',
  'image/heif',
])

const EXTENSION_MIME_OVERRIDES: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.bmp': 'image/bmp',
  '.tiff': 'image/tiff',
  '.tif': 'image/tiff',
  '.svg': 'image/svg+xml',
  '.heic': 'image/heic',
  '.heif': 'image/heif',
}

function normalizeMimeType(file: File): string {
  const providedType = file.type?.trim()
  if (providedType) {
    return providedType
  }

  const extension = path.extname(file.name).toLowerCase()
  return EXTENSION_MIME_OVERRIDES[extension] || 'application/octet-stream'
}

function buildSummaryFileName(originalName: string) {
  const parsed = path.parse(originalName)
  const base = parsed.name || 'image'
  return `${base}-vision-summary.md`
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

function validateFile(file: File): void {
  // Maximum file size: 100MB
  const MAX_FILE_SIZE = 100 * 1024 * 1024

  if (!file) {
    throw new ValidationError('No file provided')
  }

  if (!file.name || file.name.trim() === '') {
    throw new ValidationError('File name is required')
  }

  if (file.size === 0) {
    throw new ValidationError('File is empty')
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new ValidationError(
      `File size exceeds maximum allowed size of ${formatFileSize(MAX_FILE_SIZE)}`
    )
  }

  // Check for suspicious file names
  if (file.name.includes('..') || file.name.includes('/') || file.name.includes('\\')) {
    throw new ValidationError('Invalid file name')
  }
}

async function cleanupTempFiles(filePaths: string[]): Promise<void> {
  await Promise.allSettled(
    filePaths.map(async (filePath) => {
      try {
        await fs.unlink(filePath)
      } catch (error) {
        console.warn('Failed to clean up temp file:', filePath, error)
      }
    })
  )
}

async function createImageSummaryMarkdown({
  ai,
  buffer,
  mimeType,
  originalName,
}: {
  ai: GoogleGenAI
  buffer: Buffer
  mimeType: string
  originalName: string
}) {
  const response = await ai.models.generateContent({
    model: process.env.GOOGLE_VISION_MODEL ?? 'gemini-2.5-flash',
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: [
              'You are preparing an uploaded image for a knowledge base that only accepts text documents.',
              'Analyze the image and produce Markdown with the following sections:',
              '## High-level Summary (2-4 bullet points)',
              '## Key Details (facts, entities, objects, context)',
              '## Detected Text (transcribe any visible text verbatim, keep Markdown code fences for structured data)',
              '## Suggested Tags (comma separated list of themes)',
              'Preserve factual details. If something is uncertain, note it as such. Keep the response concise but information-dense.',
            ].join('\n'),
          },
          {
            inlineData: {
              data: buffer.toString('base64'),
              mimeType,
            },
          },
        ],
      },
    ],
    config: {
      temperature: 0.2,
    },
  })

  const metadata = [
    '---',
    '### Ingestion Metadata',
    `- Original filename: ${originalName}`,
    `- Original MIME type: ${mimeType}`,
    `- Processed at: ${new Date().toISOString()}`,
  ].join('\n')

  return `# Image Document: ${originalName}\n\n${response.text}\n\n${metadata}\n`
}

export async function POST(req: NextRequest) {
  const tmpFiles: string[] = []

  try {
    // Parse form data
    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      )
    }

    // Validate the file
    try {
      validateFile(file)
    } catch (error) {
      if (error instanceof ValidationError) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        )
      }
      throw error
    }

    const normalizedMimeType = normalizeMimeType(file)
    const isImageUpload = IMAGE_MIME_TYPES.has(normalizedMimeType)

    // Initialize and get file search store name
    let storeName: string
    try {
      storeName = await getFileSearchStore()
    } catch (error) {
      logError('POST:getFileSearchStore', error)
      return NextResponse.json(
        { error: 'Failed to initialize file storage. Please check your configuration.' },
        { status: 500 }
      )
    }

    // Read file buffer and save to temp path
    // NOTE: uploadToFileSearchStore requires a file path, not a buffer/stream
    const tmpDir = os.tmpdir()
    let tmpPath: string
    let buffer: Buffer | undefined

    try {
      const arrayBuffer = await file.arrayBuffer()
      buffer = Buffer.from(arrayBuffer)

      await fs.mkdir(tmpDir, { recursive: true })
      tmpPath = path.join(tmpDir, `${randomUUID()}-${file.name}`)
      await fs.writeFile(tmpPath, buffer)
      tmpFiles.push(tmpPath)
    } catch (error) {
      logError('POST:readAndSaveFile', error)
      await cleanupTempFiles(tmpFiles)
      return NextResponse.json(
        { error: 'Failed to process file data' },
        { status: 500 }
      )
    }
    console.log("Temporary file saved at:", tmpPath)

    // Use Google GenAI Files + File Search Store APIs
    const ai = new GoogleGenAI({
      apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    })
    console.log("Google GenAI client initialized.")

    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      await cleanupTempFiles(tmpFiles)
      return NextResponse.json(
        { error: 'Google AI API key is not configured' },
        { status: 500 }
      )
    }

    // OLD: Generate a valid name (lowercase alphanumeric + dashes only, max 40 chars)
    // const validName = randomUUID()
    //   .toLowerCase()
    //   .replace(/[^a-z0-9-]/g, '-')
    //   .slice(0, 40)

    let uploadPath = tmpPath
    let displayName = file.name
    let uploadMimeType = normalizedMimeType

    if (isImageUpload) {
      try {
        const summaryFileName = buildSummaryFileName(file.name)
        const summaryTmpPath = path.join(tmpDir, `${randomUUID()}-${summaryFileName}`)
        const markdownContent = await createImageSummaryMarkdown({
          ai,
          buffer,
          mimeType: normalizedMimeType,
          originalName: file.name,
        })
        await fs.writeFile(summaryTmpPath, markdownContent, 'utf-8')
        tmpFiles.push(summaryTmpPath)
        uploadPath = summaryTmpPath
        displayName = summaryFileName
        uploadMimeType = 'text/markdown'
      } catch (error) {
        logError('POST:imageProcessing', error)
        await cleanupTempFiles(tmpFiles)
        return NextResponse.json(
          { error: 'Failed to process image. Please try again.' },
          { status: 500 }
        )
      }
    }

    // OLD TWO-STEP APPROACH: Upload file to Google AI, then import to search store
    // let uploadedFile: any
    // try {
    //   uploadedFile = await ai.files.upload({
    //     file: uploadPath,
    //     config: {
    //       name: validName,
    //       displayName,
    //       mimeType: uploadMimeType,
    //     },
    //   })
    // } catch (error) {
    //   logError('POST:uploadFile', error)
    //   await cleanupTempFiles(tmpFiles)
    //   return NextResponse.json(
    //     { error: 'Failed to upload file to storage' },
    //     { status: 500 }
    //   )
    // }

    // // Import file to search store
    // let operation: any
    // try {
    //   operation = await ai.fileSearchStores.importFile({
    //     fileSearchStoreName: storeName,
    //     fileName: uploadedFile.name as string,
    //   })

    //   // Wait for import operation to complete
    //   let retries = 0
    //   const maxRetries = 60 // 5 minutes maximum wait time
    //   while (!operation.done && retries < maxRetries) {
    //     await new Promise(resolve => setTimeout(resolve, 5000))
    //     operation = await ai.operations.get({ operation })
    //     retries++
    //   }

    //   if (!operation.done) {
    //     throw new FileUploadError('File import operation timed out')
    //   }

    //   if (operation.error) {
    //     throw new FileUploadError(`File import failed: ${operation.error.message}`)
    //   }
    // } catch (error) {
    //   logError('POST:importFile', error)
    //   await cleanupTempFiles(tmpFiles)

    //   if (error instanceof FileUploadError) {
    //     return NextResponse.json(
    //       { error: error.message },
    //       { status: 500 }
    //     )
    //   }

    //   return NextResponse.json(
    //     { error: 'Failed to import file to search store' },
    //     { status: 500 }
    //   )
    // }

    console.log("Starting direct upload to file search store.")
    // NEW DIRECT UPLOAD APPROACH: Upload directly to file search store
    let operation: any
    try {
      operation = await ai.fileSearchStores.uploadToFileSearchStore({
        file: uploadPath,
        fileSearchStoreName: storeName,
        config: {
          displayName,
          mimeType: uploadMimeType,
        },
      })

      // Wait for upload operation to complete
      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 5000))
        console.log("Checking upload operation status...", operation)
        operation = await ai.operations.get({ operation })
      }

      if (operation.error) {
        throw new FileUploadError(`File upload failed: ${operation.error.message}`)
      }
    } catch (error) {
      logError('POST:uploadToFileSearchStore', error)
      await cleanupTempFiles(tmpFiles)

      if (error instanceof FileUploadError) {
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        )
      }

      return NextResponse.json(
        { error: 'Failed to upload file directly to search store' },
        { status: 500 }
      )
    }

    // Clean up temp files
    await cleanupTempFiles(tmpFiles)

    console.log('File upload operation completed:', operation)
    console.log('Operation response:', operation.response)

    // OLD: Extract document ID from imported file info
    // const documentId = operation.response?.documentName as string

    const documentId = operation.response?.documentName.split("/documents/")[1] as string
    console.log('Extracted document ID:', documentId)

    if (!documentId) {
      logError('POST:missingDocumentId', new Error('Document ID is missing from operation response'))
      return NextResponse.json(
        { error: 'File upload completed but document ID is missing' },
        { status: 500 }
      )
    }

    // Store file metadata in local database
    try {
      await addFileToDb({
        id: documentId,
        name: file.name,
        fileType: normalizedMimeType,
        size: formatFileSize(file.size),
        uploadedAt: new Date().toISOString(),
      })
    } catch (error) {
      logError('POST:saveToDatabase', error)

      // File is uploaded to Google but failed to save to DB
      // Log this for manual recovery but still return success
      console.error('WARNING: File uploaded to Google but failed to save to database:', documentId)

      return NextResponse.json(
        { error: 'File uploaded but failed to save metadata. Please contact support.' },
        { status: 500 }
      )
    }

    // Revalidate to refresh the data sources list
    revalidatePath('/', 'page')

    return NextResponse.json({
      success: true,
      message: `File '${file.name}' uploaded successfully`,
    })
  } catch (error) {
    logError('POST:unexpectedError', error)

    // Clean up any remaining temp files
    await cleanupTempFiles(tmpFiles)

    const errorMessage = getUserFriendlyErrorMessage(error)

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
