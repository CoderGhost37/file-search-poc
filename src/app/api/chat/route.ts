import { streamText, type Tool, type UIMessage } from 'ai'
import { getFileSearchStore } from '@/app/actions'
import { google } from '@ai-sdk/google';

export const maxDuration = 30

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json()

  const lastMessage = messages[messages.length - 1]

  const store = await getFileSearchStore()

  const promptParts = [
    ...lastMessage.parts,
    { type: 'text', text: 'Also give the citations/sources from where you are giving the response from' }
  ];
  const prompt = promptParts.map((part: any) => (part.type === 'text' ? part.text : '')).join('\n');

  const result = streamText({
    model: google('gemini-2.5-flash'),
    prompt,
    tools: {
      file_search: google.tools.fileSearch({
        fileSearchStoreNames: [store],
      }) as Tool,
    },
  })

  return result.toUIMessageStreamResponse()
}
