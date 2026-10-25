/**
 * Browser entry. Kept thin: it mounts the app and nothing else.
 *
 * The shell document that loads this file is `index.html` at the repository
 * root: `<html lang="vi">`, a `<div id="root">`, and
 * `<script type="module" src="/src/client/main.tsx">`.
 */

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./styles/global.css";

const container = document.getElementById("root");
if (!container) {
  throw new Error("Thiếu phần tử #root trong index.html.");
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
