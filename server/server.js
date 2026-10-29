require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const http = require("http");
const { initSocket } = require("./socket");

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

const authRoutes = require("./routes/authRoutes");
app.use(express.json());
app.use("/api/auth", authRoutes);

const faqRoutes = require('./routes/faqRoutes');
app.use('/api/faqs', faqRoutes);

const postRoutes = require('./routes/postRoutes');
app.use('/api/posts', postRoutes);

const commentRoutes = require('./routes/commentRoutes');
app.use('/api/comments', commentRoutes);

const notificationRoutes = require('./routes/notificationRoutes');
app.use('/api/notifications', notificationRoutes);

const announcementRoutes = require('./routes/announcementRoutes');
app.use('/api/announcements', announcementRoutes);

app.get("/", (req, res) => {
  res.send("Campus Connect server is running");
});

const server = http.createServer(app);
initSocket(server);

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});