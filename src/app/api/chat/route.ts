import { streamText, type Tool, type UIMessage } from 'ai'
import { getFileSearchStore } from '@/app/actions'
import { google } from '@ai-sdk/google';

export const maxDuration = 30

export async function POST(req: Request) {
  const { messages, selectedDataSources }: { messages: UIMessage[]; selectedDataSources?: { id: string, name: string }[] } = await req.json()
  console.log('Selected Data Sources:', selectedDataSources);

  const lastMessage = messages[messages.length - 1]

  const store = await getFileSearchStore()

  const promptParts = [
    ...lastMessage.parts,
    { type: 'text', text: 'Also give the citations/sources from where you are giving the response from' }
  ];
  const prompt = promptParts.map((part: any) => (part.type === 'text' ? part.text : '')).join('\n');

  // Build file search configuration
  const fileSearchConfig: any = {
    fileSearchStoreNames: [store],
  }

  // If specific data sources are selected, build metadata filter dynamically
  if (selectedDataSources && selectedDataSources.length > 0) {
    const metadataFilters = selectedDataSources.map(
      (source) => `original_filename = "${source.name}"`
    )
    fileSearchConfig.metadataFilter = metadataFilters.join(' OR ')
    console.log('Metadata Filter:', fileSearchConfig.metadataFilter)
  }

  const result = streamText({
    model: google('gemini-2.5-flash'),
    prompt,
    tools: {
      file_search: google.tools.fileSearch(fileSearchConfig) as Tool,
    },
  })

  return result.toUIMessageStreamResponse()
}
