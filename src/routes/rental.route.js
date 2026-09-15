const express = require("express");
const { createRental } = require("../controllers/rental.controller");
const router = express.Router();

router.post("/create", createRental)
module.exports = router;