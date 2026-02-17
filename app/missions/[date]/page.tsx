import { MissionPageClient } from './MissionPageClient'

interface PageProps {
  params: Promise<{ date: string }>
}

export default async function MissionPage({ params }: PageProps) {
  const { date } = await params

  return <MissionPageClient date={date} />
}
