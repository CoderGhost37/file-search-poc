'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { AlignHorizontalDistributeCenter, FileText, FileType, UploadCloudIcon } from 'lucide-react'
import { useTransition } from 'react'
import { useDropzone } from 'react-dropzone'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import * as z from 'zod'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'

// Comprehensive list of supported file types for Gemini File Search API
const IMAGE_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  'image/bmp',
  'image/tiff',
  'image/heic',
  'image/heif',
]

const SUPPORTED_MIME_TYPES = [
  // Documents
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/msword', // .doc
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.ms-excel', // .xls
  'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
  'application/vnd.oasis.opendocument.text', // .odt

  // Data formats
  'application/json',
  'application/xml',
  'text/xml',
  'text/csv',
  'text/tab-separated-values',
  'application/x-yaml',
  'text/yaml',

  // Text formats
  'text/plain',
  'text/markdown',
  'text/html',
  'text/rtf',

  // Code files
  'text/x-python',
  'text/javascript',
  'application/javascript',
  'text/typescript',
  'application/typescript',
  'text/x-java-source',
  'text/x-c',
  'text/x-c++',
  'text/x-csharp',
  'text/x-go',
  'text/x-rust',
  'text/x-ruby',
  'text/x-php',
  'text/x-kotlin',
  'text/x-swift',
  'text/x-dart',
  'application/x-sh',
  'text/x-shellscript',

  // Archives
  'application/zip',

  // Notebooks
  'application/x-ipynb+json',

  // SQL
  'application/sql',
  'text/x-sql',

  // Images (processed through Gemini Vision before ingestion)
  ...IMAGE_MIME_TYPES,
]

export const uploadSchema = z.object({
  file: z
    .instanceof(File)
    .refine(
      (file) => file.size <= 100 * 1024 * 1024, // 100MB max
      { message: 'File size must be less than 100MB.' }
    )
    .refine(
      (file) => SUPPORTED_MIME_TYPES.includes(file.type) || file.type === '',
      { message: 'File type not supported. See supported formats in the documentation.' }
    ),
})

type UploadFormValues = z.infer<typeof uploadSchema>

export function UploadForm({ onClose }: { onClose: () => void }) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const form = useForm<UploadFormValues>({
    resolver: zodResolver(uploadSchema),
    defaultValues: {
      file: undefined,
    },
  })

  const onDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles?.length > 0) {
      form.setValue('file', acceptedFiles[0], { shouldValidate: true })
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      // Documents
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
      'application/vnd.oasis.opendocument.text': ['.odt'],

      // Data formats
      'application/json': ['.json'],
      'application/xml': ['.xml'],
      'text/xml': ['.xml'],
      'text/csv': ['.csv'],
      'text/tab-separated-values': ['.tsv'],
      'application/x-yaml': ['.yaml', '.yml'],
      'text/yaml': ['.yaml', '.yml'],

      // Text formats
      'text/plain': ['.txt'],
      'text/markdown': ['.md', '.markdown'],
      'text/html': ['.html', '.htm'],
      'text/rtf': ['.rtf'],

      // Code files
      'text/x-python': ['.py'],
      'text/javascript': ['.js', '.mjs'],
      'application/javascript': ['.js'],
      'text/typescript': ['.ts'],
      'application/typescript': ['.ts'],
      'text/x-java-source': ['.java'],
      'text/x-c': ['.c', '.h'],
      'text/x-c++': ['.cpp', '.hpp', '.cc', '.cxx'],
      'text/x-csharp': ['.cs'],
      'text/x-go': ['.go'],
      'text/x-rust': ['.rs'],
      'text/x-ruby': ['.rb'],
      'text/x-php': ['.php'],
      'text/x-kotlin': ['.kt'],
      'text/x-swift': ['.swift'],
      'text/x-dart': ['.dart'],
      'application/x-sh': ['.sh'],
      'text/x-shellscript': ['.sh', '.bash', '.zsh', '.csh'],

      // Archives
      'application/zip': ['.zip'],

      // Notebooks
      'application/x-ipynb+json': ['.ipynb'],

      // SQL
      'application/sql': ['.sql'],
      'text/x-sql': ['.sql'],

      // Images
      'image/png': ['.png'],
      'image/jpeg': ['.jpeg', '.jpg'],
      'image/jpg': ['.jpg'],
      'image/webp': ['.webp'],
      'image/gif': ['.gif'],
      'image/svg+xml': ['.svg'],
      'image/bmp': ['.bmp'],
      'image/tiff': ['.tiff', '.tif'],
      'image/heic': ['.heic'],
      'image/heif': ['.heif'],
    },
    maxFiles: 1,
    maxSize: 100 * 1024 * 1024, // 100MB max
    multiple: false,
  })

  async function onSubmit(values: UploadFormValues) {
    startTransition(async () => {
      try {
        const formData = new FormData()
        formData.append('file', values.file)

        const response = await fetch('/api/embeddings/upload', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          let errorMessage = 'Upload failed'

          try {
            const errorData = await response.json()
            errorMessage = errorData.error || errorMessage
          } catch {
            // If response is not JSON, use status text
            errorMessage = response.statusText || errorMessage
          }

          throw new Error(errorMessage)
        }

        const data = await response.json()
        const successMessage = data.message || 'File uploaded successfully!'

        toast.success(successMessage)
        router.refresh() // Refresh the page to show new data
        onClose()
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.'
        toast.error(errorMessage)
        console.error('Upload error:', error)
      }
    })
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="file"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Upload File</FormLabel>
              <FormControl>
                <div>
                  {field.value ? (
                    <Card className="mt-4 shadow-md border border-gray-200">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <FileText className="h-5 w-5 text-blue-600" />
                            <span className="font-medium">{field.value.name}</span>
                          </div>
                          <div className="mt-1 flex gap-4 text-sm">
                            <div className="flex items-center gap-1">
                              <FileType className="h-4 w-4" />
                              <span>{field.value.name.split('.').pop()?.toLowerCase()}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <AlignHorizontalDistributeCenter className="h-4 w-4" />
                              <span>{formatBytes(field.value.size)}</span>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => form.resetField('file')}
                        >
                          Remove
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    <div
                      {...getRootProps()}
                      className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:bg-card"
                    >
                      <UploadCloudIcon className="size-12 mx-auto mb-2 text-gray-400" />
                      <input {...getInputProps()} />
                      {isDragActive ? (
                        <p className="text-gray-600">Drop the file here...</p>
                      ) : !field.value ? (
                        <div className="text-gray-500 space-y-2">
                          <p className="font-medium">
                            Drag & drop a file here, or click to select
                          </p>
                          <div className="text-xs text-gray-400 space-y-1">
                            <p><strong>Documents:</strong> PDF, DOCX, DOC, XLSX, XLS, PPTX, ODT</p>
                            <p><strong>Data:</strong> JSON, XML, CSV, TSV, YAML, SQL</p>
                            <p><strong>Text:</strong> TXT, MD, HTML, RTF</p>
                            <p><strong>Code:</strong> Python, JavaScript, TypeScript, Java, C++, Go, Rust, Ruby, PHP, Shell scripts</p>
                            <p><strong>Other:</strong> ZIP archives, Jupyter notebooks (.ipynb)</p>
                            <p><strong>Images:</strong> PNG, JPG, JPEG, WEBP, GIF, SVG, BMP, TIFF, HEIC/HEIF</p>
                            <p className="pt-1 text-gray-500"><strong>Max size:</strong> 100MB</p>
                            <p className="pt-1 text-gray-500 italic">
                              Image files are automatically summarized with Gemini Vision before being added to File Search.
                            </p>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" loading={isPending} className="w-full">
          Upload
        </Button>
      </form>
    </Form>
  )
}
