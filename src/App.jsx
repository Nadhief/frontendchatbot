import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./Login";
import Dashboard from "./Dashboard";
import AdminTools from "./admin/AdminTools";
import ProtectedRoute from "./components/ProtectedRoute";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import RegisterPage from "./Register";

// Buat theme dengan font Poppins
const theme = createTheme({
  typography: {
    fontFamily: "'Poppins', 'Roboto', 'Arial', sans-serif",
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/reg" element={<RegisterPage />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute
                element={<AdminTools />}
                allowedRoles={["admin"]}
              />
            }
          />
          <Route
            path="/chat"
            element={
              <ProtectedRoute
                element={<Dashboard />}
                allowedRoles={["user"]}
              />
            }
          />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
