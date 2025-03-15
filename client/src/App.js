import React from "react";
import FileUpload from "./FileUpload";
import "./App.css";

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>SocketShare</h1>
        <p className="app-subtitle">Simple file sharing</p>
      </header>
      <main className="app-main">
        <FileUpload />
      </main>
      <footer className="app-footer">
        <p>&copy; {new Date().getFullYear()} SocketShare</p>
      </footer>
    </div>
  );
}

export default App;
