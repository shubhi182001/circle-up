const express = require("express");
const app = express();

const mongoose = require("mongoose");
const dotenv = require('dotenv');
const helmet = require('helmet');
const morgan = require("morgan");
const userRoute = require("./routes/users");
const authRoute = require("./routes/auth");
const postRoute = require("./routes/posts");
const conversationRoute  = require("./routes/conversations");
const messageRoute = require("./routes/messages");
const multer = require("multer");
const path = require("path");
// const server = require("http").createServer();
dotenv.config();

const port  = process.env.PORT || 8000
var cors = require("cors");
app.use(cors());

app.get('/', (req,res)=>{    res.send("API works");
});



mongoose.connect(process.env.MONGO_URL, {useNewUrlParser:true}).then( () => {
    console.log("Connected to mongo")
}).catch((e) => {
    console.log(e)
});

app.use("/images", express.static(path.join(__dirname  , "public/images")));

//middlewares:
app.use(express.json());
app.use(helmet());
app.use(morgan('common'));

const storage = multer.diskStorage({
    destination:(req, file, cb) => {
        cb(null, "public/images")
    },
    filename:(req, file, cb) => {
        cb(null, req.body.name)
    }
})

const upload = multer({storage: storage});
app.post("/api/upload" , upload.single("file"), (req, res) => {
    try{
        return res.status(200).json("File Uploaded Successfully");
    }catch(e) {
        console.log(e);
    }
})

app.use("/api/users", userRoute);
app.use("/api/auth", authRoute);
app.use("/api/posts", postRoute);
app.use("/api/conversations", conversationRoute);
app.use("/api/messages", messageRoute);

 
// server.listen(process.env.PORT || 8000);
const server =  app.listen(port, () => {
    console.log("backend is running"); 
})

const io = require("socket.io")(server, {
    cors:{
        origin:"http://localhost:3000",
        methods: ["GET", "POST"]
    }
})

let users = [];
const addUser = (userId, socketId) => {
    !users.some((user) => user.userId === userId) && users.push({userId,socketId});
}
const removeUser = (socketId) => {
    users = users.filter((user) => user.socketId !== socketId)
}

const getUser = (userId) => {
    return users.find(user => user.userId === userId)
}

io.on("connection", (socket) => {

    //connection:
    console.log("a user connected");
    socket.on("addUser", (userId) => {
        addUser(userId, socket.id);
        io.emit("getUsers", users)
    })

    //send and get message:
    socket.on("sendMessage", ({senderId, receiverId, text}) => {
        const user = getUser(receiverId);
        io.to(user.socketId).emit("getMessage", {
            senderId,
            text
        })
    })

    //disconnection:
    socket.on("disconnect", () => {
        console.log("a user disconnected");
        removeUser(socket.id);
        io.emit("getUsers", users);
    })
})