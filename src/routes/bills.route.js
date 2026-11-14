const express = require("express")
const { getAllBills, getBillById } = require("../controllers/bills.controller")
const router = express.Router()

router.get("/all", getAllBills)
router.get("/:rentalId", getBillById);

module.exports = router
