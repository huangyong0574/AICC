import { useState, useEffect } from 'react';
import Home from './pages/Home';
import ConceptDetail from './pages/ConceptDetail';

function getRoute(): { page: string; id?: string } {
  const hash = window.location.hash.slice(1) || '/';
  const parts = hash.split('/').filter(Boolean);
  if (parts[0] === 'concept' && parts[1]) {
    return { page: 'concept', id: parts[1] };
  }
  return { page: 'home' };
}

export default function App() {
  const [route, setRoute] = useState(getRoute);

  useEffect(() => {
    const handler = () => setRoute(getRoute());
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  const navigate = (path: string) => {
    window.location.hash = path;
  };

  if (route.page === 'concept' && route.id) {
    return (
      <ConceptDetail
        conceptId={route.id}
        onBack={() => navigate('/')}
      />
    );
  }

  return (
    <Home onNavigate={(id) => navigate(`/concept/${id}`)} />
  );
}
