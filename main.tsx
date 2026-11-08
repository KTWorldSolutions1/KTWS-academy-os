import React from 'react';
import {createRoot} from 'react-dom/client';
import WorkspaceErrorBoundary from './app/workspace-error-boundary';
import Independent from './app/independent';
import './app/globals.css';
createRoot(document.getElementById('root')!).render(<React.StrictMode><WorkspaceErrorBoundary><Independent/></WorkspaceErrorBoundary></React.StrictMode>);
