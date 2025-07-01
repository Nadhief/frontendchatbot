import * as React from "react";
import PropTypes from "prop-types";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import CssBaseline from "@mui/material/CssBaseline";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import InboxIcon from "@mui/icons-material/MoveToInbox";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import MenuIcon from "@mui/icons-material/Menu";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import { Button, Menu, MenuItem, Stack, TextField } from "@mui/material";
import ProfilPict from "../assets/oke.png";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import ConfirmDialog from "../components/ConfirmDialog";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import api from "../services/api";

const drawerWidth = 240;

function LayoutUser({ window, children, onNewHistory, userId }) {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [selectedHistoryName, setSelectedHistoryName] = React.useState(null);
  const [selectedHistoryId, setSelectedHistoryId] = React.useState(null);
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  const name = localStorage.getItem("name") || "User";

  const [renamingItem, setRenamingItem] = React.useState(null);
  const [newName, setNewName] = React.useState("");

  const inputRef = React.useRef(null);

  const [historyData, setHistoryData] = React.useState([]);
  const [historyMessage, setHistoryMessage] = React.useState([]);

  const childrenWithProps = React.isValidElement(children)
    ? React.cloneElement(children, { historyMessage })
    : children;

  React.useEffect(() => {
    if (renamingItem && inputRef.current) {
      inputRef.current.focus();
    }
  }, [renamingItem]);

  React.useEffect(() => {
    const savedId = localStorage.getItem("selectedHistoryId");
    const savedName = localStorage.getItem("selectedHistoryName");

    if (savedId && savedName) {
      setSelectedHistoryId(Number(savedId));
      setSelectedHistoryName(savedName);
    }
  }, []);

  const handleMenuOpen = (event, historyItem) => {
    setAnchorEl(event.currentTarget);
    setSelectedHistoryName(historyItem.title);
    setSelectedHistoryId(historyItem.id);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedHistoryName(null);
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleRename = () => {
    setRenamingItem(selectedHistoryName);
    setNewName(selectedHistoryName);
    handleMenuClose();
  };

  const handleDelete = () => {
    setConfirmOpen(true);
    handleMenuClose();
  };

  const handleConfirmDelete = async () => {
    try {
      console.log("Confirmed delete:", selectedHistoryName);

      await axios.delete(`http://localhost:5000/history/${selectedHistoryId}`);

      setHistoryData((prev) =>
        prev.filter((item) => item.id !== selectedHistoryId)
      );

      if (
        localStorage.getItem("selectedHistoryId") === String(selectedHistoryId)
      ) {
        localStorage.setItem("selectedHistoryId", 0);
        localStorage.removeItem("selectedHistoryName");
      }

      setConfirmOpen(false);
      setSelectedHistoryId(null);
      setSelectedHistoryName(null);
      localStorage.removeItem("historyMessage");
    } catch (error) {
      console.error("❌ Gagal menghapus riwayat:", error);
    }
  };

  const handleRenameSubmit = async () => {
    try {
      await axios.patch(
        `http://localhost:5000/chat/history/${selectedHistoryId}/rename`,
        {
          newTitle: newName,
        }
      );

      if (onNewHistory?.current) onNewHistory.current();

      // Update state dan localStorage dengan nama baru
      setSelectedHistoryName(newName);
      localStorage.setItem("selectedHistoryName", newName);

      setRenamingItem(null);
    } catch (error) {
      console.error("❌ Gagal rename:", error);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  React.useEffect(() => {
    const fetchHistories = async () => {
      try {
        const res = await api.get(`/chat/history/list?userId=${userId}`);
        setHistoryData(res.data);
      } catch (error) {
        console.error(
          "❌ Gagal ambil data riwayat:",
          error.response?.data || error.message
        );
      }
    };

    if (onNewHistory) onNewHistory.current = fetchHistories;

    fetchHistories();
  }, [onNewHistory]);

  React.useEffect(() => {
    if (!selectedHistoryId) return;

    const fetchMessageByHistoryId = async () => {
      try {
        const res = await fetch(
          `http://localhost:5000/history/${selectedHistoryId}/messages`
        );
        const data = await res.json();
        localStorage.setItem("historyMessage", JSON.stringify(data));
        setHistoryMessage(data);
      } catch (error) {
        console.error("❌ Gagal ambil data riwayat:", error);
      }
    };

    fetchMessageByHistoryId();
  }, [selectedHistoryId]);

  const handleNewChat = () => {
    // Hapus data lokal
    localStorage.setItem("historyMessage", "[]");
    localStorage.setItem("selectedHistoryId", 0);
    localStorage.setItem("penyakit", "");

    localStorage.removeItem("selectedHistoryName");
    setSelectedHistoryId(null);
    setSelectedHistoryName(null);
  };

  const drawer = (
    <div>
      <Stack direction="row" spacing={2} alignItems="center" padding={1}>
        <Box
          component="img"
          src={ProfilPict}
          alt="Gambar"
          sx={{ width: 50, height: 50, borderRadius: "100%" }}
        />

        <Stack
          direction="column"
          alignItems="flex-start"
          justifyContent="flex-start"
        >
          <Typography variant="h6" fontWeight={600} color="#2E3A59">
            {name}
          </Typography>
        </Stack>

        <Box sx={{ flexGrow: 1 }} />
      </Stack>
      <Divider />
      <List>
        <ListItemButton onClick={handleNewChat}>
          <ListItemIcon>
            <InboxIcon />
          </ListItemIcon>
          <ListItemText primary={"Chat Baru"} />
        </ListItemButton>
      </List>
      <Box sx={{ px: 2, py: 1 }}>
        <Typography variant="h6" fontWeight={500}>
          Riwayat Chat
        </Typography>
      </Box>
      <List>
        {historyData.map((item, index) => (
          <ListItem
            key={index}
            selected={item.id === selectedHistoryId}
            onClick={() => {
              console.log("kocak");
              setSelectedHistoryId(item.id);
              setSelectedHistoryName(item.title);
              localStorage.setItem("selectedHistoryId", item.id);
              localStorage.setItem("selectedHistoryName", item.title);
              localStorage.setItem("penyakit", item.penyakit);
            }}
            secondaryAction={
              renamingItem !== item?.title && (
                <IconButton
                  edge="end"
                  onClick={(event) => handleMenuOpen(event, item)}
                >
                  <MoreVertIcon />
                </IconButton>
              )
            }
            sx={{
              "&:hover": {
                backgroundColor: "#f0f0f0",
                cursor: "pointer",
              },
              backgroundColor:
                item.id === selectedHistoryId ? "#e0e0e0" : "inherit",
              transition: "background-color 0.2s ease-in-out",
            }}
          >
            {renamingItem === item?.title ? (
              <TextField
                inputRef={inputRef}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onBlur={handleRenameSubmit}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleRenameSubmit();
                  }
                }}
                size="small"
                fullWidth
              />
            ) : (
              <ListItemText primary={item?.title} />
            )}
          </ListItem>
        ))}
      </List>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          elevation: 2,
          sx: {
            border: "1px solid #e0e0e0",
          },
        }}
      >
        <MenuItem onClick={handleRename}>Rename</MenuItem>
        <MenuItem onClick={handleDelete}>Hapus</MenuItem>
      </Menu>
    </div>
  );

  const container =
    window !== undefined ? () => window().document.body : undefined;

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          bgcolor: "white",
        }}
      >
        <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
          <IconButton
            color="black"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: "none" } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{ color: "black" }}
          >
            Chatbot Kesehatan Gigi
          </Typography>
          <Button
            variant="contained"
            sx={{ bgcolor: "#213448" }}
            onClick={handleLogout}
          >
            Logout
          </Button>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
        aria-label="mailbox folders"
      >
        <Drawer
          container={container}
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: "block", sm: "none" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", sm: "block" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
        }}
      >
        <Toolbar />
        {childrenWithProps}
      </Box>
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Hapus Riwayat Chat?"
        description={`Riwayat ini akan dihapus secara permanen.`}
      />
    </Box>
  );
}

LayoutUser.propTypes = {
  window: PropTypes.func,
  children: PropTypes.node,
};

export default LayoutUser;
