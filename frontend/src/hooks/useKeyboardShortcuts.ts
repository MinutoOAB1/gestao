import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export function useKeyboardShortcuts() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Evitar acionar atalhos se o foco estiver em um input ou textarea
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA' ||
        document.activeElement?.tagName === 'SELECT'
      ) {
        return;
      }

      if (e.altKey) {
        switch (e.key.toLowerCase()) {
          case 'n': // Alt + N -> Novo Processo
            e.preventDefault();
            navigate('/processos/novo');
            break;
          case 'c': // Alt + C -> Novo Cliente
            e.preventDefault();
            navigate('/clientes/novo');
            break;
          case 'a': // Alt + A -> Agenda
            e.preventDefault();
            navigate('/agenda');
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);
}
