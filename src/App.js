import { Routes, Route } from "react-router-dom";
import CameraKtp from "./KTPScanner";
import Dashboard from "./Dashboard";

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/scan" element={<CameraKtp />} />
      </Routes>
    </div>
  );
}

export default App;
