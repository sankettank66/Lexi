import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';

const CONTAINER_ID = 'ai-grammar-root';

function inject() {
  if (document.getElementById(CONTAINER_ID)) return;
  const root = document.createElement('div');
  root.id = CONTAINER_ID;
  document.documentElement.appendChild(root);
  const shadow = root.attachShadow({ mode: 'open' });
  const style = document.createElement('style');
  style.textContent = ':host { all: initial; }';
  shadow.appendChild(style);
  const mount = document.createElement('div');
  shadow.appendChild(mount);
  const reactRoot = createRoot(mount);
  reactRoot.render(React.createElement(App));
}

inject();
