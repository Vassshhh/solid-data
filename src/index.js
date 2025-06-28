// index.js
import React from "react";
import ReactDOM from "react-dom/client"; // ✅ use 'react-dom/client' in React 18+
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";

// ✅ createRoot instead of render
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
