import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import Router from "./app/router";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <Router />
  </React.StrictMode>
);

