import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import cssStr from './index.css?inline';

const CONTAINER_ID = 'lexi-root';

function inject() {
  if (document.getElementById(CONTAINER_ID)) { console.log('[Lexi] already injected'); return; }
  const root = document.createElement('div');
  root.id = CONTAINER_ID;
  document.documentElement.appendChild(root);
  const shadow = root.attachShadow({ mode: 'open' });
  const style = document.createElement('style');
  style.textContent = cssStr;
  shadow.appendChild(style);
  const mount = document.createElement('div');
  shadow.appendChild(mount);
  const reactRoot = createRoot(mount);
  reactRoot.render(React.createElement(App));
}

const readyStates = ['interactive', 'complete'];
if (readyStates.includes(document.readyState)) {
  inject();
} else {
  document.addEventListener('DOMContentLoaded', inject);
}
