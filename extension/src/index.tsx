import React from 'react';
import ReactDOM from 'react-dom';
import Popup from './pages/Popup';

// This file renders the Popup component into the div with id 'popup-root'
ReactDOM.render(
  <React.StrictMode>
    <Popup />
  </React.StrictMode>,
  document.getElementById('popup-root')
);
