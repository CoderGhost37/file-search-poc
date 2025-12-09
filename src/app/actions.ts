'use server'

import { GoogleGenAI } from '@google/genai'
import type { DataSource } from '@/lib/types'
import { deleteFileFromDb, getAllFiles } from '@/lib/db'
import { revalidatePath, unstable_noStore as noStore } from 'next/cache'
import { FileDeletionError, getUserFriendlyErrorMessage, logError } from '@/lib/errors'

// Initialize Google AI client
function getGoogleAI() {
  return new GoogleGenAI({
    apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
  })
}

// Get file search store name from environment variable
async function getFileSearchStoreName(): Promise<string> {
  const storeName = process.env.FILE_SEARCH_STORE_NAME

  if (!storeName) {
    throw new Error(
      'FILE_SEARCH_STORE_NAME environment variable is not set. ' +
      'Please create a file search store and set its resource name in your environment variables.'
    )
  }

  console.log('Using file search store:', storeName)
  return storeName
}

// Fetch data sources from local database
export async function getDataSources(): Promise<DataSource[]> {
  // Disable caching for this function
  noStore()

  try {
    // Fetch data from local database instead of Google API
    const files = await getAllFiles()

    const documents: DataSource[] = files.map((file) => ({
      id: file.id,
      name: file.name,
      type: file.fileType,
      size: file.size,
      createdAt: file.uploadedAt,
    }))

    return documents
  } catch (error) {
    logError('getDataSources', error)
    // Return empty array instead of throwing to prevent page crash
    // The UI will show "No data sources found"
    return []
  }
}

// Delete a document from Google File Search Store and local database
export async function deleteDataSource(documentId: string) {
  try {
    console.log('Attempting to delete document with ID:', documentId)

    if (!documentId || typeof documentId !== 'string' || documentId.trim() === '') {
      return {
        success: false,
        message: 'Invalid document ID provided'
      }
    }

    // Initialize store first (ensures it exists)
    const storeName = await getFileSearchStoreName()
    const ai = getGoogleAI()

    const documentName = `${storeName}/documents/${documentId}`
    console.log('Deleting from Google API with path:', documentName)

    // Delete the document from the file search store
    try {
      await ai.fileSearchStores.documents.delete({
        name: documentName,
        config: {
          force: true,
        },
      })
      console.log('Successfully deleted from Google API')
    } catch (googleError) {
      logError('deleteDataSource:GoogleAPI', googleError)

      // If the file doesn't exist in Google API, continue to delete from DB
      if (googleError instanceof Error && !googleError.message.includes('not found')) {
        throw new FileDeletionError(
          'Failed to delete file from Google File Search Store',
          googleError
        )
      }
      console.log('File not found in Google API, continuing with DB deletion')
    }

    console.log('Deleting from local database')

    // Delete from local database
    try {
      await deleteFileFromDb(documentId)
      console.log('Successfully deleted from local database')
    } catch (dbError) {
      logError('deleteDataSource:Database', dbError)

      // If file is not found in DB, that's okay (might have been deleted already)
      if (!(dbError instanceof Error && dbError.message.includes('not found'))) {
        throw new FileDeletionError(
          'Failed to delete file from database',
          dbError
        )
      }
    }

    // Revalidate the page to refresh data
    revalidatePath('/', 'page')

    return {
      success: true,
      message: 'File deleted successfully'
    }
  } catch (error) {
    logError('deleteDataSource', error)

    const userMessage = getUserFriendlyErrorMessage(error)

    return {
      success: false,
      message: userMessage
    }
  }
}

// Export function to get store name for upload operations
export async function getFileSearchStore(): Promise<string> {
  // Initialize store first (ensures it exists)
  return await getFileSearchStoreName()
}
