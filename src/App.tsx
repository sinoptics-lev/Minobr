import { Routes, Route } from 'react-router'
import { StoreProvider, useStore } from '@/lib/store'
import { Header } from '@/components/Header'
import { Registry } from '@/components/Registry'
import { ObjectCard } from '@/components/ObjectCard'
import { Projects, ProjectCard } from '@/components/Projects'
import { Cabinet } from '@/components/Cabinet'
import { Dashboard } from '@/components/Dashboard'
import { WorksDashboard } from '@/components/WorksDashboard'

function Shell() {
  const { view } = useStore()
  return (
    <div className="min-h-screen bg-[#f4f5f7]">
      <Header />
      <main className="max-w-[1400px] mx-auto px-4 py-5">
        {view.name === 'registry' && <Registry />}
        {view.name === 'object' && <ObjectCard id={view.id} />}
        {view.name === 'projects' && <Projects />}
        {view.name === 'project' && <ProjectCard id={view.id} />}
        {view.name === 'cabinet' && <Cabinet />}
        {view.name === 'dashboard' && <Dashboard />}
        {view.name === 'works' && <WorksDashboard />}
      </main>
      <footer className="border-t bg-white mt-6">
        <div className="max-w-[1400px] mx-auto px-4 py-3 text-xs text-muted-foreground flex justify-between">
          <span>ИС СА · интерактивный прототип для отработки пользовательских сценариев</span>
          <span>Правительство Московской области · 2026</span>
        </div>
      </footer>
    </div>
  )
}

function Home() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
    </Routes>
  )
}
