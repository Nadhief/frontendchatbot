import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import Button from "@mui/material/Button";
import LayoutUser from "./components/LayoutUser";
import {
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  Stack,
  TextField,
  Typography,
  Paper,
} from "@mui/material";
import ChatbotImage from "./assets/Chatbot.png";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ReactMarkdown from "react-markdown";
import api from "./services/api.js"; // Import API service

const Dashboard = () => {
  const [responses, setResponses] = useState(() => {
    const savedHistoryMessage = localStorage.getItem("historyMessage");
    if (savedHistoryMessage) {
      try {
        const parsed = JSON.parse(savedHistoryMessage);

        // Urutkan berdasarkan created_at jika ada
        parsed.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

        return parsed.map((msg) => ({
          from: msg.sender,
          text: msg.message,
        }));
      } catch (err) {
        console.error("Gagal parse historyMessage:", err);
        return [];
      }
    }
    return [];
  });

  const [penyakit, setPenyakit] = useState(() => {
    return localStorage.getItem("penyakit") || "";
  });
  const [subtopik, setSubtopik] = useState(() => {
    return localStorage.getItem("subtopik") || "";
  });
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const userId = localStorage.getItem("userId") || 0;
  console.log("User ID:", userId);
  const [historyId, setHistoryId] = useState(() => {
    const saved = localStorage.getItem("selectedHistoryId");
    if (!saved) {
      localStorage.setItem("selectedHistoryId", 0);
      return 0;
    }
    return parseInt(saved, 10);
  });
  const onNewHistory = useRef();
  const [rekamMedis, setRekamMedis] = useState([]);

  useEffect(() => {
    localStorage.setItem("penyakit", penyakit);
    localStorage.setItem("subtopik", subtopik);
  }, [penyakit, subtopik]);

  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === "penyakit") {
        setPenyakit(e.newValue || "");
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const handleSend = async () => {
    if (!question.trim()) return;
    const userInput = question.trim();

    setResponses((prev) => [...prev, { from: "user", text: userInput }]);
    setQuestion("");
    setLoading(true);

    try {
      let currentHistoryId = historyId;

      // 1. Kirim pertanyaan ke backend Flask
      const res = await axios.post("https://chatbotskripsi.site/model/api/chat", {
        text: userInput,
      });

      const botReply = res.data.message;
      const diagnosis = res.data.diagnosis;
      const subtopik = res.data.subtopik;

      setPenyakit(diagnosis);
      setSubtopik(subtopik);
      localStorage.setItem("penyakit", diagnosis);
      localStorage.setItem("subtopik", subtopik);

      // 2. Buat chat history jika belum ada
      if (historyId === 0) {
        const resHistory = await api.post("/chat/history/start", {
          userId,
          title: userInput.slice(0, 50) || "Percakapan baru",
          penyakit: diagnosis,
        });
        currentHistoryId = resHistory.data.historyId;
        setHistoryId(currentHistoryId);
        localStorage.setItem("selectedHistoryId", currentHistoryId);
        localStorage.setItem("firstMessageLogged", "false"); // Flag bahwa belum pernah log
      }

      if (onNewHistory.current) onNewHistory.current(); // Refresh list history

      // 3. Simpan pesan user dan ambil messageId
      const userMessageRes = await api.post("/chat/history/message", {
        chatHistoryId: currentHistoryId,
        sender: "user",
        message: userInput,
      });
      const messageId = userMessageRes.data.id;

      // 4. Simpan pesan bot
      await api.post("/chat/history/message", {
        chatHistoryId: currentHistoryId,
        sender: "bot",
        message: botReply,
      });

      // 5. Simpan diagnosis log (pakai messageId)
      await api.post(`/chat/history/${currentHistoryId}/diagnosis`, {
        messageId,
        penyakit: diagnosis,
        subtopik,
      });

      // 4. Tampilkan balasan bot
      setResponses((prev) => [...prev, { from: "bot", text: botReply }]);
    } catch (error) {
      console.error("Error handleSend:", error);
      setResponses((prev) => [
        ...prev,
        {
          from: "bot",
          text: "Maaf, terjadi kesalahan saat memproses pesan Anda.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateMedicalRecord = async () => {
    if (!historyId) return;

    // Simulasi pesan user
    const fakeUserInput = "buatkan saya rekam medis";
    const userMessageRes = await api.post("/chat/history/message", {
      chatHistoryId: historyId,
      sender: "user",
      message: fakeUserInput,
    });
    setResponses((prev) => [...prev, { from: "user", text: fakeUserInput }]);

    try {
      // Ambil diagnosis logs
      const res = await api.get(`/chat/history/${historyId}/diagnosis`);
      const logs = res.data;
      console.log(logs);

      if (logs.length === 0) {
        setResponses((prev) => [
          ...prev,
          { from: "bot", text: "Belum ada data diagnosis untuk riwayat ini." },
        ]);
        return;
      }

      // Format ke bentuk paragraf
      const paragraph = logs
        .map((log, index) => {
          return `${index + 1}. Keluhan "${
            log.chatMessage.message
          }". Berdasarkan hal ini, diagnosis yang diberikan adalah **${log.penyakit.replaceAll(
            "_",
            " "
          )}** dengan fokus subtopik **${log.subtopik}**.`;
        })
        .join("\n\n");
      console.log(paragraph);

      await api.post("/chat/history/message", {
        chatHistoryId: historyId,
        sender: "bot",
        message: paragraph,
      });

      // (Opsional) Kirim ke endpoint untuk generate PDF
      const pdfRes = await api.post("/chat/history/pdf", {
        historyId: historyId, // atau cukup { historyId } jika variabel sama
        diagnosisLogs: paragraph,
      });

      const pdfUrl = pdfRes.data.url;
      console.log(pdfUrl);
      window.open(`https://chatbotskripsi.site/api${pdfUrl}`, "_blank");

      // Tampilkan hasil ke UI chat
      setResponses((prev) => [
        ...prev,
        {
          from: "bot",
          // text: `${paragraph}\n\n)`,
          text: `${paragraph}\n\n📄 Rekam medis ini juga tersedia dalam bentuk PDF: [Download PDF](${pdfUrl})`,
        },
      ]);
    } catch (err) {
      console.error("Gagal generate rekam medis:", err);
      setResponses((prev) => [
        ...prev,
        {
          from: "bot",
          text: "Terjadi kesalahan saat membuat rekam medis.",
        },
      ]);
    }
  };

  useEffect(() => {
    let lastHistoryMessage = localStorage.getItem("historyMessage");

    const interval = setInterval(() => {
      const currentHistoryMessage = localStorage.getItem("historyMessage");

      if (currentHistoryMessage !== lastHistoryMessage) {
        lastHistoryMessage = currentHistoryMessage;

        try {
          const parsedHistory = JSON.parse(currentHistoryMessage || "[]");

          // 👉 URUTKAN DI SINI
          parsedHistory.sort(
            (a, b) => new Date(a.created_at) - new Date(b.created_at)
          );

          setResponses(
            parsedHistory.map((msg) => ({
              from: msg.sender,
              text: msg.message,
            }))
          );
        } catch (err) {
          console.error("Gagal parse historyMessage:", err);
        }
      }
    }, 500);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (historyId) {
      localStorage.setItem("selectedHistoryId", historyId);
    }
  }, [historyId]);

  useEffect(() => {
    const syncHistoryId = () => {
      const newId = localStorage.getItem("selectedHistoryId");
      if (newId && parseInt(newId) !== historyId) {
        setHistoryId(parseInt(newId));
      }
    };

    const interval = setInterval(syncHistoryId, 500);
    return () => clearInterval(interval);
  }, [historyId]);

  useEffect(() => {
    const interval = setInterval(() => {
      const currentPenyakit = localStorage.getItem("penyakit") || "";
      if (currentPenyakit !== penyakit) {
        setPenyakit(currentPenyakit);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [penyakit]);

  return (
    <LayoutUser onNewHistory={onNewHistory} userId={userId}>
      {responses?.length === 0 && (
        <Stack
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            textAlign: "center",
          }}
        >
          <img
            src={ChatbotImage}
            alt="Chatbot"
            style={{ maxWidth: "127px", height: "120px" }}
          />
          <Typography variant="h4" sx={{ color: "#757575", mt: 2 }}>
            Halo!
          </Typography>
          <Typography variant="h4" sx={{ my: 2 }}>
            Yuk, Temukan Jawaban untuk Gigi Sehatmu!
          </Typography>
        </Stack>
      )}

      {/* Chat History */}
      <Stack spacing={2} sx={{ my: 4, px: 2, mx: "auto" }} width={"70%"}>
        {responses?.map((msg, idx) => (
          <Paper
            key={idx}
            elevation={1}
            sx={{
              p: 2,
              maxWidth: "100%",
              alignSelf: msg.from === "user" ? "flex-end" : "flex-start",
              backgroundColor: msg.from === "user" ? "#DCF8C6" : "#F1F0F0",
              borderRadius: 2,
            }}
          >
            <ReactMarkdown
              children={msg.text}
              components={{
                p: ({ children }) => (
                  <Typography variant="body1" paragraph>
                    {children}
                  </Typography>
                ),
                strong: ({ children }) => (
                  <strong style={{ fontWeight: 600 }}>{children}</strong>
                ),
                a: ({ href, children }) => (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "#1e88e5" }}
                  >
                    {children}
                  </a>
                ),
              }}
            />
          </Paper>
        ))}
      </Stack>

      {/* Chat Input */}
      <Stack
        sx={{
          position: "sticky",
          bottom: 0,
          zIndex: 10,
          mx: "auto",
          backgroundColor: "white",
          pb: 2,
        }}
        width={"70%"}
      >
        <Grid container direction="column" spacing={2}>
          <Grid item>
            {historyId != 0 && (
              <Button
                variant="outlined"
                onClick={handleGenerateMedicalRecord}
                sx={{
                  borderRadius: "20px",
                  textTransform: "none",
                  borderColor: "#213448",
                  color: "#213448",
                  "&:hover": {
                    backgroundColor: "#213448",
                    color: "white",
                  },
                }}
              >
                Lihat Rekam Medis
              </Button>
            )}
          </Grid>

          <Grid item>
            <TextField
              fullWidth
              placeholder="Ask any question..."
              size="small"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              multiline
              maxRows={8}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              sx={{
                width: "100%",
                "& .MuiOutlinedInput-root": {
                  borderRadius: "20px",
                  backgroundColor: "#f5f5f5",
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor: "black",
                  },
                },
              }}
              InputProps={{
                sx: {
                  borderRadius: "20px",
                  backgroundColor: "#f5f5f5",
                },
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={handleSend}
                      disabled={loading}
                      sx={{
                        backgroundColor: "#213448",
                        color: "white",
                        "&:hover": {
                          backgroundColor: "#547792",
                        },
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                      }}
                    >
                      <ArrowUpwardIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
        </Grid>
      </Stack>
    </LayoutUser>
  );
};

export default Dashboard;
