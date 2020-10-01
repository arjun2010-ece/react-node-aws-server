const express = require("express");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();


const app = express();


//db connection
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    useFindAndModify: false    
})
.then(() => console.log('DB Connected'))
.catch(err => {
    console.log(`DB connection error: ${err.message}`)
})



//import routes
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");
const categoryRoutes = require("./routes/category");
const linkRoutes = require("./routes/link");



// app middlewares
app.use(morgan("dev"));
// app.use(bodyParser.json());
app.use(bodyParser.json({ limit: "5mb", type: "application/json" }));
app.use(cors({
    origin: process.env.CLIENT_URL
}));


//route middleware
app.use("/api", authRoutes);
app.use("/api", userRoutes);
app.use("/api", categoryRoutes);
app.use("/api", linkRoutes);


const port = process.env.PORT || 8000;
app.listen(port, () => console.log(`App is running on port ${port}`));
