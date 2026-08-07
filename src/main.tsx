import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { LanguageProvider } from './context/LanguageContext';
import { MediaProvider } from './context/MediaContext';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageProvider>
      <MediaProvider>
        <App />
      </MediaProvider>
    </LanguageProvider>
  </StrictMode>,
);
