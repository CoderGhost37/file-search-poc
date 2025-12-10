import { ChatWindow } from '@/components/chat/chat-window'
import { DataSourcesContainer } from '@/components/data-sources/data-sources.container'
import { getDataSources } from './actions'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function Home() {
  const dataSources = await getDataSources()

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-background">
      <DataSourcesContainer />
      <ChatWindow dataSources={dataSources} />
    </div>
  )
}
