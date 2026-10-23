import React, { Suspense, lazy } from 'react';
const IdeaCenterApp = lazy(() => import('./ideacenter/IdeaCenterApp.jsx'));

export default function App() {
  return (
    <Suspense fallback={null}>
      <IdeaCenterApp />
    </Suspense>
  );
}


