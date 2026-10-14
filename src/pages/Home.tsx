import Nav from '../sections/Nav'
import Hero from '../sections/Hero'
import Background from '../sections/Background'
import Stats from '../sections/Stats'
import Framework from '../sections/Framework'
import Mismatch from '../sections/Mismatch'
import OperLoop from '../sections/OperLoop'
import Roadmap from '../sections/Roadmap'
import Footer from '../sections/Footer'

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <main>
        <Hero />
        <Background />
        <Stats />
        <Framework />
        <Mismatch />
        <OperLoop />
        <Roadmap />
      </main>
      <Footer />
    </div>
  )
}
