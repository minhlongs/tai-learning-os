/**
 * Browser entry. Kept thin: it mounts the app and nothing else.
 *
 * NOTE: `index.html` at the repository root is NOT owned by the client code and
 * does not exist yet. It must be created with `<html lang="vi">`, a
 * `<div id="root">`, and `<script type="module" src="/src/client/main.tsx">`.
 * See the delivery report.
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
