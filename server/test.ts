import cors from "cors";
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

const app = express();
const server = createServer(app);
const PORT = 5006; // Define it once here

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    credentials: true
  }
});

app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
  res.status(200).json({ msg: "hey there !" });
});

io.on("connection", (socket:any) => {
  console.log("User connected");
  console.log("User id : ", socket.id);
  // console.log("socket all data",socket)
  socket.emit("welcome", `welcome to the server , ${socket.id}`);
  socket.broadcast.emit("welcome", `welFuck u come to the server , ${socket.id}`);
  socket.on("disconnect",()=>{
    console.log("user disconnected ",socket.id)
  });
  socket.on("message",(m)=>{
    console.log("message=",m)
    io.emit("message-receive",m)
  })
  socket.on("cook",()=>{
    console.log("cook ur dick .")

  })

});

// Use the variable so the console message is always accurate
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});