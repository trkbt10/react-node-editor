/**
 * @file Entry point for the Vite example preview application
 */
import * as React from "react";
import { createRoot } from "react-dom/client";

import "../global.css";

import { ExamplePreviewApp } from "./ExamplePreviewApp";

const container = document.getElementById("root");

if (container === null) {
  throw new Error("Root container element not found");
}

const root = createRoot(container);

root.render(
  <React.StrictMode>
    <ExamplePreviewApp />
  </React.StrictMode>,
);
