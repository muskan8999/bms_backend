const express = require("express")
const cors = require("cors")
const helmet = require("helmet")
const morgan = require('morgan')
require("dotenv").config()
const customerRoutes = require("./routes/customer.route")
const materialRoutes = require("./routes/material.route")
const rentalRoutes = require("./routes/rental.route")
const billsRoutes = require("./routes/bills.route")

const app = express();

const PORT = process.env.PORT || 5000

app.use(cors())
app.use(helmet());
app.use(morgan('dev'))
app.use(express.json())

app.use("/api/customers", customerRoutes)
app.use("/api/materials", materialRoutes)
app.use("/api/rentals", rentalRoutes)
app.use("/api/bills", billsRoutes)


app.get("/", (req,res)=>{
    res.json({
        message : "Backend is running"
    })
})

app.listen(PORT, ()=>{
    console.log(`Server running on port ${PORT}`);
})