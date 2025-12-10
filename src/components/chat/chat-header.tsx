import { RefreshCcw, FileText } from 'lucide-react'
import { ModeToggle } from '@/components/theme/theme-toggle'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { DataSource } from '@/lib/types'

interface ChatHeaderProps {
  clearChat: () => void
  selectedDataSources?: DataSource[]
}

export function ChatHeader({ clearChat, selectedDataSources = [] }: ChatHeaderProps) {
  // Show first 3 sources, rest in "+X more" badge
  const maxVisibleSources = 3
  const visibleSources = selectedDataSources.slice(0, maxVisibleSources)
  const remainingCount = selectedDataSources.length - maxVisibleSources
  const hasMoreSources = remainingCount > 0

  return (
    <div className="hidden lg:block p-4 border-b border-border bg-card flex-shrink-0">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xl font-semibold text-foreground">RAG Assistant</p>
          {selectedDataSources.length > 0 ? (
            <div className="mt-2">
              <div className="flex items-center gap-2 mb-1">
                <FileText className="size-3 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">
                  Chatting with {selectedDataSources.length} source{selectedDataSources.length !== 1 ? 's' : ''}:
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {visibleSources.map((ds) => (
                  <TooltipProvider key={ds.id}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge
                          variant="secondary"
                          className="text-xs max-w-[200px] truncate cursor-default"
                        >
                          {ds.name}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{ds.name}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
                {hasMoreSources && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge
                          variant="secondary"
                          className="text-xs cursor-default"
                        >
                          +{remainingCount} more
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <div className="space-y-1">
                          <p className="font-medium mb-2">All sources ({selectedDataSources.length}):</p>
                          {selectedDataSources.map((ds, index) => (
                            <p key={ds.id} className="text-xs">
                              {index + 1}. {ds.name}
                            </p>
                          ))}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Ask questions about your uploaded data sources
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <ModeToggle />

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={clearChat}>
                  <RefreshCcw className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Clear chat</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  )
}
