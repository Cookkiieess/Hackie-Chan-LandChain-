import { Navigate, Route, Routes } from "react-router-dom";
import AuthPage from "./pages/AuthPage";
import HomePage from "./pages/HomePage";
import PanchayatDashboard from "./pages/PanchayatDashboard";
import RegistrarDashboard from "./pages/RegistrarDashboard";

function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");

  if (!token || !userId) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default function App() {
  const token = localStorage.getItem("token");

  return (
    <Routes>
      <Route path="/" element={token ? <Navigate to="/home" replace /> : <AuthPage />} />
      <Route
        path="/home"
        element={
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        }
      />
      <Route path="/registrar" element={<RegistrarDashboard />} />
      <Route path="/panchayat" element={<PanchayatDashboard />} />
      <Route path="*" element={<Navigate to={token ? "/home" : "/"} replace />} />
    </Routes>
  );
}
