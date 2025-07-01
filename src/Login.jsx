import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { loginUser } from "./services";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [openError, setOpenError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const role = localStorage.getItem("role");
    if (role === "admin") {
      navigate("/admin");
    } else if (role === "user") {
      navigate("/chat");
    }
  }, [navigate]);

  const handleLogin = async () => {
    if (!username || !password) {
      setErrorMessage("Username dan password harus diisi.");
      setOpenError(true);
      return;
    }

    try {
      const res = await loginUser({
        email: username,
        password: password,
      });
      localStorage.setItem("role", res.role || "user");
      localStorage.setItem("name", res.name);
      localStorage.setItem("accessToken", res.accessToken);
      localStorage.setItem("userId", res.userId);
      
      // Navigasi
      if (res.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/chat");
      }
    } catch (err) {
      const msg = err.response?.data?.msg || "Login gagal. Silakan coba lagi.";
      setErrorMessage(msg);
      setOpenError(true);
    }
  };

  const handleClose = () => {
    setOpenError(false);
  };

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      height="100vh"
    >
      <Snackbar
        open={openError}
        autoHideDuration={3000}
        onClose={handleClose}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert onClose={handleClose} severity="error" sx={{ width: "100%" }}>
          {errorMessage}
        </Alert>
      </Snackbar>

      <Card
        sx={{
          width: "454px",
          p: 2,
          boxShadow: 3,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          borderRadius: "10px",
        }}
      >
        <CardContent>
          <Stack
            direction="column"
            spacing={2}
            width="100%"
            alignItems="center"
            sx={{ marginBottom: "30px" }}
          >
            <Typography fontSize={30} fontWeight={700}>
              Chatbot Kesehatan Gigi
            </Typography>
          </Stack>

          <Typography variant="body1" align="start" fontWeight="bold">
            Email
          </Typography>
          <TextField
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            fullWidth
            margin="normal"
            sx={{ mt: 0 }}
          />

          <Typography
            variant="body1"
            align="start"
            fontWeight="bold"
            sx={{ mt: 2 }}
          >
            Password
          </Typography>
          <TextField
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            fullWidth
            margin="normal"
            sx={{ mt: 0 }}
          />

          <Stack alignItems="center">
            <Button
              variant="contained"
              onClick={handleLogin}
              sx={{
                mt: 2,
                backgroundColor: "#213448",
                color: "white",
                width: "70%",
              }}
            >
              Login
            </Button>
          </Stack>
          <Stack
            direction="row"
            justifyContent="center"
            mt={2}
            sx={{ cursor: "pointer", textDecoration: "underline" }}
          >
            <Link to="/reg">
              <Typography variant="body2">Belum punya akun? Register</Typography>
            </Link>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}

export default Login;
