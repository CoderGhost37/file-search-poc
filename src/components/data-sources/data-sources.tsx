'use client'

import { useState, useTransition, useEffect } from 'react'
import { FileText, Loader2, Search, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { deleteDataSource } from '@/app/actions'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { getCategoryColor, getFileTypeInfo } from '@/lib/file-type-utils'
import type { DataSource } from '@/lib/types'
import { AddSourceModal } from '../add-source-modal/add-source-modal'

export function DataSources({ data }: { data: DataSource[] }) {
  const [dataSources, setDataSources] = useState<DataSource[]>(data)
  const [searchQuery, setSearchQuery] = useState('')

  // Update local state when data prop changes
  useEffect(() => {
    setDataSources(data)
  }, [data])

  const filteredDataSources = dataSources.filter((source) => {
    const matchesSearch = source.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  })

  return (
    <div className="flex flex-col h-full">
      {/* Fixed Header */}
      <div className="p-4 border-b border-border flex-shrink-0">
        <div className="flex items-center justify-between gap-4 mb-4">
          <h2 className="text-lg font-semibold text-foreground">Data Sources</h2>
          <AddSourceModal />
        </div>
        {/* Search */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search data sources..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {/* Scrollable Data Sources List */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-4 space-y-3">
          {filteredDataSources.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No data sources found</p>
              <p className="text-xs mt-1">Add files to get started</p>
            </div>
          ) : (
            filteredDataSources.map((source) => (
              <Card
                key={source.id}
                className="p-3 hover:bg-accent/50 transition-colors max-w-[350px]"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 flex-1 min-w-0">
                    <div className="mt-0.5">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium text-foreground truncate flex-1">
                          {source.name}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 mb-2">
                        {(() => {
                          const fileInfo = getFileTypeInfo(source.type)
                          const categoryColor = getCategoryColor(fileInfo.category)
                          return (
                            <Badge
                              variant="outline"
                              className={`text-xs ${categoryColor}`}
                            >
                              {fileInfo.label}
                            </Badge>
                          )
                        })()}

                        {source.size && (
                          <span className="text-xs text-muted-foreground">
                            {source.size}
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-muted-foreground mt-1">
                        Added {new Date(source.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <DeleteSourceBtn sourceId={source.id} sourceName={source.name} />
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

function DeleteSourceBtn({ sourceId, sourceName }: { sourceId: string, sourceName: string }) {
  const [isPending, startTransition] = useTransition()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const router = useRouter()

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) {
      return
    }

    setDeletingId(id)
    startTransition(async () => {
      try {
        const result = await deleteDataSource(id)
        if (result.success) {
          toast.success('File deleted successfully')
          router.refresh() // Refresh the page to show updated data
        } else {
          toast.error(result.message || 'Failed to delete file')
        }
      } catch (_error) {
        toast.error('Failed to delete file')
      } finally {
        setDeletingId(null)
      }
    })
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8 text-muted-foreground hover:text-destructive"
      onClick={() => handleDelete(sourceId, sourceName)}
      disabled={deletingId === sourceId}
    >
      {isPending ?
        <Loader2 className='size-4 animate-spin' />
        :
        <Trash2 className="size-4 text-destructive" />
      }
    </Button>
  )
}
