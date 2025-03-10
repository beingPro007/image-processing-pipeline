import {createServer} from 'http';
import { Server } from "socket.io";

const server = createServer();
const io = new Server(server, { cors: { origin: "*" } });

io.on("connection", (socket) => {
    console.log("Connection success!!!"); 
    
    socket.on("disconnect", () => {
        console.log("Disconnected successfully!!!");
    })
})

server.listen(8080, () => {
    console.log("Listening on port 8080");
})

export default io;