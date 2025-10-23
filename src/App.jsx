import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { HilfsmittelFinder } from './components/HilfsmittelFinder';
import { Impressum } from './pages/Impressum';
import { Datenschutz } from './pages/Datenschutz';
import { InstallPrompt } from './components/InstallPrompt';

function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen flex-col bg-background text-text">
        <header className="border-b border-gray-200 bg-white/90 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
            <Link to="/" className="text-2xl font-bold text-primary">
              Aboelo Hilfsmittel-Finder
            </Link>
            <nav className="flex items-center gap-6 text-lg">
              <Link className="hover:text-primary" to="/impressum">
                Impressum
              </Link>
              <Link className="hover:text-primary" to="/datenschutz">
                Datenschutz
              </Link>
            </nav>
          </div>
        </header>

        <main className="flex-1">
          <Routes>
            <Route path="/" element={<HilfsmittelFinder />} />
            <Route path="/impressum" element={<Impressum />} />
            <Route path="/datenschutz" element={<Datenschutz />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>

        <footer className="border-t border-gray-200 bg-white/90">
          <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-6 text-sm text-gray-600 md:flex-row md:items-center md:justify-between">
            <p>© {new Date().getFullYear()} Aboelo. Alle Rechte vorbehalten.</p>
            <div className="flex gap-4">
              <Link className="hover:text-primary" to="/impressum">
                Impressum
              </Link>
              <Link className="hover:text-primary" to="/datenschutz">
                Datenschutz
              </Link>
            </div>
          </div>
        </footer>

        <InstallPrompt />
      </div>
    </BrowserRouter>
  );
}

function NotFound() {
  return (
    <section className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center px-6 text-center">
      <h1 className="text-4xl font-bold text-text">Seite nicht gefunden</h1>
      <p className="mt-4 text-lg text-gray-600">
        Die angeforderte Seite existiert nicht. Bitte kehren Sie zur Startseite zurück.
      </p>
      <Link
        to="/"
        className="mt-6 rounded-xl bg-primary px-6 py-3 text-lg font-semibold text-white hover:bg-blue-700"
      >
        Zur Startseite
      </Link>
    </section>
  );
}

export default App;
