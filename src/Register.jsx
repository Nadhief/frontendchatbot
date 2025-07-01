import React, { useState } from "react";
import {
  Container,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  Stack,
} from "@mui/material";
import { registerUser } from "./services/index";
import { Link, useNavigate } from "react-router-dom";

const RegisterPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confPassword: "",
    role: "user",
  });

  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const res = await registerUser(form);
      setSuccessMsg(res.msg);
      setForm({
        name: "",
        email: "",
        password: "",
        confPassword: "",
        role: "user",
      });
      navigate("/");
    } catch (err) {
      setErrorMsg(err.response?.data?.msg || "Register failed");
    }
  };

  return (
    <Container maxWidth="sm">
      <Box mt={8} p={4} boxShadow={3} borderRadius={2} bgcolor="white">
        <Typography fontSize={35} fontWeight={700}>
          Register
        </Typography>
        {errorMsg && <Alert severity="error">{errorMsg}</Alert>}
        {successMsg && <Alert severity="success">{successMsg}</Alert>}
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            margin="normal"
            label="Nama Lengkap"
            name="name"
            value={form.name}
            onChange={handleChange}
            required
          />
          <TextField
            fullWidth
            margin="normal"
            label="Email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            required
          />
          <TextField
            fullWidth
            margin="normal"
            label="Password"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            required
          />
          <TextField
            fullWidth
            margin="normal"
            label="Confirm Password"
            name="confPassword"
            type="password"
            value={form.confPassword}
            onChange={handleChange}
            required
          />
          <TextField
            fullWidth
            hidden
            margin="normal"
            name="role"
            value={form.role}
            onChange={handleChange}
            required
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            sx={{ mt: 3, bgcolor: "#213448" }}
          >
            Register
          </Button>
        </form>
        <Stack
          direction="row"
          justifyContent="center"
          mt={2}
          sx={{ cursor: "pointer", textDecoration: "underline" }}
        >
          <Link to="/">
            <Typography variant="body2">Sudah punya akun? Login</Typography>
          </Link>
        </Stack>
      </Box>
    </Container>
  );
};

export default RegisterPage;
