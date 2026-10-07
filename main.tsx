import React from 'react';
import {createRoot} from 'react-dom/client';
import Independent from './app/independent';
import './app/globals.css';
createRoot(document.getElementById('root')!).render(<React.StrictMode><Independent/></React.StrictMode>);
