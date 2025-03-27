import React from "react";
import { Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Dashboard from "./pages/Dashboard";
import PredictionForm from "./pages/PredictionForm";
import RouteOptimization from "./pages/RouteOptimization";
import ChatAssistant from "./pages/ChatAssistant";

function App() {
  return (
    <div className="App">
      <Header />
      <main className="container py-4">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/predict" element={<PredictionForm />} />
          <Route path="/optimize" element={<RouteOptimization />} />
          <Route path="/chat" element={<ChatAssistant />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;
