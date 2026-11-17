import "./styles/mintlify.css";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Footer from "./components/Footer";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

function App() {
  const location = useLocation();

  useEffect(() => {
    if (location.pathname !== "/" || location.hash !== "#features") return;
    requestAnimationFrame(() => {
      document.getElementById("features")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [location.pathname, location.hash]);

  return (
    <div className="App">
      <Navbar />
      <Hero />
      <Footer />
    </div>
  );
}

export default App;
