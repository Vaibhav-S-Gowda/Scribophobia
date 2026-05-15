import { Canvas } from './components/Canvas'
import { TopBar } from './components/TopBar'
import { LeftToolbar } from './components/LeftToolbar'
import { BottomRightControls } from './components/BottomRightControls'
import { ShareModal } from './components/ShareModal'
import { HelpModal } from './components/HelpModal'
import { Minimap } from './components/Minimap'

function App() {
  return (
    <div className="App" style={{ position: 'relative', width: '100vw', height: '100vh' }}>
      <TopBar />
      <LeftToolbar />
      <BottomRightControls />
      <Canvas />
      <ShareModal />
      <HelpModal />
      <Minimap />
    </div>
  )
}

export default App
