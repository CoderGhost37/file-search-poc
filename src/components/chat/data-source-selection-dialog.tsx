'use client'

import { useState, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
import { getFileTypeColor, getFileTypeLabel } from '@/lib/file-type-utils'
import type { DataSource } from '@/lib/types'

interface SelectedDataSource {
  id: string
  name: string
}

interface DataSourceSelectionDialogProps {
  dataSources: DataSource[]
  onStartChat: (selected: SelectedDataSource[]) => void
  trigger?: React.ReactNode
}

export function DataSourceSelectionDialog({
  dataSources,
  onStartChat,
  trigger,
}: DataSourceSelectionDialogProps) {
  const [open, setOpen] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')

  const handleToggle = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const handleSelectAll = () => {
    const filteredIds = filteredDataSources.map((ds) => ds.id)
    const allFilteredSelected = filteredIds.every((id) => selectedIds.includes(id))

    if (allFilteredSelected) {
      // Deselect all filtered items
      setSelectedIds((prev) => prev.filter((id) => !filteredIds.includes(id)))
    } else {
      // Select all filtered items
      setSelectedIds((prev) => [...new Set([...prev, ...filteredIds])])
    }
  }

  const handleStartChat = () => {
    if (selectedIds.length > 0) {
      const selected = dataSources
        .filter(ds => selectedIds.includes(ds.id))
        .map(ds => ({ id: ds.id, name: ds.name }))
      onStartChat(selected)
      setOpen(false)
      // Reset search when dialog closes
      setSearchQuery('')
    }
  }

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    if (!isOpen) {
      setSearchQuery('')
    }
  }

  // Filter data sources based on search query
  const filteredDataSources = useMemo(() => {
    if (!searchQuery.trim()) {
      return dataSources
    }

    const query = searchQuery.toLowerCase()
    return dataSources.filter((ds) =>
      ds.name.toLowerCase().includes(query) ||
      getFileTypeLabel(ds.type).toLowerCase().includes(query)
    )
  }, [dataSources, searchQuery])

  const allFilteredSelected = filteredDataSources.length > 0 &&
    filteredDataSources.every((ds) => selectedIds.includes(ds.id))

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="lg" className="text-base px-8 py-6">
            Start New Chat
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl gap-0 p-0 overflow-hidden" style={{ height: '85vh' }}>
        <div className="flex flex-col h-full overflow-hidden">
          <DialogHeader className="flex-shrink-0 px-6 pt-6 pb-4">
            <DialogTitle>Select Data Sources</DialogTitle>
            <DialogDescription>
              Choose the documents you want to chat with. You can select multiple
              sources.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3 flex-1 overflow-hidden px-6">
            {/* Search Bar */}
            <div className="relative flex-shrink-0">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Selection Controls */}
            <div className="flex items-center justify-between flex-shrink-0">
              <div className="text-sm text-muted-foreground">
                {selectedIds.length} of {dataSources.length} selected
                {searchQuery && filteredDataSources.length !== dataSources.length && (
                  <span className="ml-1">
                    ({filteredDataSources.length} shown)
                  </span>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                disabled={filteredDataSources.length === 0}
              >
                {allFilteredSelected ? 'Deselect All' : 'Select All'}
              </Button>
            </div>

            {/* Data Sources List */}
            {dataSources.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center flex-1">
                <p className="text-muted-foreground mb-2">No data sources available</p>
                <p className="text-sm text-muted-foreground">
                  Upload some documents to get started
                </p>
              </div>
            ) : filteredDataSources.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center flex-1">
                <p className="text-muted-foreground mb-2">No documents found</p>
                <p className="text-sm text-muted-foreground">
                  Try a different search term
                </p>
              </div>
            ) : (
              <div className="flex-1 overflow-hidden">
                <ScrollArea className="h-full pr-4">
                  <div className="space-y-2 pb-2">
                    {filteredDataSources.map((ds) => (
                      <DataSourceItem
                        key={ds.id}
                        dataSource={ds}
                        isSelected={selectedIds.includes(ds.id)}
                        onToggle={handleToggle}
                      />
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
          </div>

          <DialogFooter className="flex-shrink-0 px-6 py-4 border-t bg-background">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleStartChat}
              disabled={selectedIds.length === 0}
            >
              Start Chat ({selectedIds.length})
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}

interface DataSourceItemProps {
  dataSource: DataSource
  isSelected: boolean
  onToggle: (id: string) => void
}

function DataSourceItem({ dataSource, isSelected, onToggle }: DataSourceItemProps) {
  const fileTypeColor = getFileTypeColor(dataSource.type)

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
    // biome-ignore lint/a11y/noStaticElementInteractions: <explanation>
    <div
      className={`flex items-start gap-3 p-3 rounded-lg border transition-colors cursor-pointer hover:bg-accent ${isSelected ? 'bg-accent border-primary' : ''
        }`}
      onClick={() => onToggle(dataSource.id)}
    >
      <Checkbox
        checked={isSelected}
        onCheckedChange={() => onToggle(dataSource.id)}
        className="mt-1"
      />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate mb-1">{dataSource.name}</p>
        <div className="flex items-center gap-2 mb-1">
          <Badge
            variant="secondary"
            className={`text-xs ${fileTypeColor}`}
          >
            {getFileTypeLabel(dataSource.type)}
          </Badge>
          {dataSource.size && (
            <span className="text-xs text-muted-foreground">
              {dataSource.size}
            </span>
          )}
        </div>
        {dataSource.createdAt && (
          <p className="text-xs text-muted-foreground mt-1">
            Uploaded {new Date(dataSource.createdAt).toLocaleDateString()}
          </p>
        )}
      </div>
    </div>
  )
}