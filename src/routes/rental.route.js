const express = require("express");
const { createRental, getAllRentals, getRentalById } = require("../controllers/rental.controller");
const { getRuntime } = require("@prisma/client/runtime/index-browser");
const router = express.Router();

router.post("/create", createRental)
router.get("/all", getAllRentals)
router.get("/:id", getRentalById)
module.exports = router;