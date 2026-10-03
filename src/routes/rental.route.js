const express = require("express");
const { createRental, getAllRentals } = require("../controllers/rental.controller");
const router = express.Router();

router.post("/create", createRental)
router.get("/all", getAllRentals)
module.exports = router;