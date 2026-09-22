import express from "express";
import dotenv from "dotenv";

const app = express();
const PORT = process.env.PORT || 8081;
dotenv.config();

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});



app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
})     