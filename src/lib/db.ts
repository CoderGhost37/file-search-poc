import { prisma } from './prisma'
import { DatabaseError, logError, ValidationError } from './errors'

export interface FileMetadata {
  id: string // Document ID from Google File Search API
  name: string // Original file name
  fileType: string // MIME type
  size: string // File size
  uploadedAt: string // ISO timestamp
}

// Validate file metadata before database operations
function validateFileMetadata(file: Partial<FileMetadata>): void {
  if (!file.id || typeof file.id !== 'string' || file.id.trim() === '') {
    throw new ValidationError('File ID is required and must be a non-empty string')
  }

  if (!file.name || typeof file.name !== 'string' || file.name.trim() === '') {
    throw new ValidationError('File name is required and must be a non-empty string')
  }

  if (!file.fileType || typeof file.fileType !== 'string') {
    throw new ValidationError('File type is required and must be a valid MIME type')
  }

  if (!file.size || typeof file.size !== 'string') {
    throw new ValidationError('File size is required')
  }
}

// Add a new file to the database
export async function addFileToDb(file: FileMetadata): Promise<void> {
  try {
    // Validate input
    validateFileMetadata(file)

    await prisma.dataSources.create({
      data: {
        id: file.id,
        name: file.name,
        type: file.fileType,
        size: file.size,
      },
    })
    console.log('File added to database:', file.id)
  } catch (error) {
    logError('addFileToDb', error)

    if (error instanceof ValidationError) {
      throw error
    }

    // Check for duplicate key error
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      throw new DatabaseError(
        `A file with ID "${file.id}" already exists in the database`,
        error
      )
    }

    throw new DatabaseError('Failed to add file to database', error)
  }
}

// Get all files from the database
export async function getAllFiles(): Promise<FileMetadata[]> {
  try {
    const files = await prisma.dataSources.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    })

    return files.map((file) => ({
      id: file.id,
      name: file.name,
      fileType: file.type,
      size: file.size,
      uploadedAt: file.createdAt.toISOString(),
    }))
  } catch (error) {
    logError('getAllFiles', error)
    throw new DatabaseError('Failed to fetch files from database', error)
  }
}

// Get a file by ID
export async function getFileById(id: string): Promise<FileMetadata | undefined> {
  try {
    if (!id || typeof id !== 'string' || id.trim() === '') {
      throw new ValidationError('File ID is required and must be a non-empty string')
    }

    const file = await prisma.dataSources.findUnique({
      where: { id },
    })

    if (!file) {
      return undefined
    }

    return {
      id: file.id,
      name: file.name,
      fileType: file.type,
      size: file.size,
      uploadedAt: file.createdAt.toISOString(),
    }
  } catch (error) {
    logError('getFileById', error)

    if (error instanceof ValidationError) {
      throw error
    }

    throw new DatabaseError(`Failed to fetch file with ID "${id}"`, error)
  }
}

// Delete a file from the database
export async function deleteFileFromDb(id: string): Promise<void> {
  try {
    if (!id || typeof id !== 'string' || id.trim() === '') {
      throw new ValidationError('File ID is required and must be a non-empty string')
    }

    await prisma.dataSources.delete({
      where: { id },
    })
    console.log('File deleted from database:', id)
  } catch (error) {
    logError('deleteFileFromDb', error)

    if (error instanceof ValidationError) {
      throw error
    }

    // Check if the record doesn't exist
    if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
      throw new DatabaseError(
        `File with ID "${id}" not found in the database`,
        error
      )
    }

    throw new DatabaseError(`Failed to delete file with ID "${id}"`, error)
  }
}

// Update a file in the database
export async function updateFileInDb(id: string, updates: Partial<Omit<FileMetadata, 'id'>>): Promise<void> {
  try {
    if (!id || typeof id !== 'string' || id.trim() === '') {
      throw new ValidationError('File ID is required and must be a non-empty string')
    }

    if (!updates || Object.keys(updates).length === 0) {
      throw new ValidationError('At least one field must be provided for update')
    }

    const updateData: Record<string, string> = {}
    if (updates.name) updateData.name = updates.name
    if (updates.fileType) updateData.type = updates.fileType
    if (updates.size) updateData.size = updates.size

    await prisma.dataSources.update({
      where: { id },
      data: updateData,
    })
    console.log('File updated in database:', id)
  } catch (error) {
    logError('updateFileInDb', error)

    if (error instanceof ValidationError) {
      throw error
    }

    // Check if the record doesn't exist
    if (error instanceof Error && error.message.includes('Record to update not found')) {
      throw new DatabaseError(
        `File with ID "${id}" not found in the database`,
        error
      )
    }

    throw new DatabaseError(`Failed to update file with ID "${id}"`, error)
  }
}
