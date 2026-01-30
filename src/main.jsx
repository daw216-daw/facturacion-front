import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { ThemeModeProvider } from './styles/ThemeContext';
import { AuthProvider } from './features/auth/context/AuthContext';
import App from './app/App';
import './index.css';


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeModeProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ThemeModeProvider>
  </StrictMode>
);

