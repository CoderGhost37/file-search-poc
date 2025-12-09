// Custom error types for better error handling

export class DatabaseError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message)
    this.name = 'DatabaseError'
  }
}

export class FileUploadError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message)
    this.name = 'FileUploadError'
  }
}

export class FileDeletionError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message)
    this.name = 'FileDeletionError'
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

// Error message formatter for user-friendly messages
export function getUserFriendlyErrorMessage(error: unknown): string {
  if (error instanceof ValidationError) {
    return error.message
  }

  if (error instanceof DatabaseError) {
    return 'Database operation failed. Please try again or contact support if the issue persists.'
  }

  if (error instanceof FileUploadError) {
    return error.message
  }

  if (error instanceof FileDeletionError) {
    return 'Failed to delete the file. Please try again.'
  }

  if (error instanceof Error) {
    // Check for common Prisma errors
    if (error.message.includes('Unique constraint')) {
      return 'This file already exists in the database.'
    }
    if (error.message.includes('Foreign key constraint')) {
      return 'Cannot perform this operation due to related data.'
    }
    if (error.message.includes('Record to delete does not exist')) {
      return 'The file you are trying to delete no longer exists.'
    }
    if (error.message.includes('Connection')) {
      return 'Database connection failed. Please check your connection and try again.'
    }

    // Return the original error message for other Error instances
    return error.message
  }

  // Fallback for unknown error types
  return 'An unexpected error occurred. Please try again.'
}

// Log errors with context
export function logError(context: string, error: unknown): void {
  console.error(`[${context}]`, error)

  if (error instanceof Error) {
    console.error('Error name:', error.name)
    console.error('Error message:', error.message)
    console.error('Error stack:', error.stack)

    if ('cause' in error && error.cause) {
      console.error('Error cause:', error.cause)
    }
  }
}
