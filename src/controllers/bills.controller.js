
const billService = require("../services/bills.service");

const getAllBills = async (req, res) => {
  try {
    const { page, limit, search, status } = req.query;

    const billData = await billService.getAllBills({
      page,
      limit,
      search,
      status,
    });

    return res.status(200).json({
      success: true,
      message: "Bills fetched successfully",
      billData,
    });
  } catch (error) {
    console.error("Get all bills error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch bills",
    });
  }
};

const getBillById = async (req, res) => {
  try {
    const { rentalId } = req.params;

    const bill = await billService.getBillById(rentalId);

    return res.status(200).json({
      success: true,
      message: "Bill fetched successfully",
      bill,
    });
  } catch (error) {
    console.error("Get bill by ID error:", error);

    const statusCode =
      error.message === "Bill not found" ? 404 : 500;

    return res.status(statusCode).json({
      success: false,
      message: error.message || "Failed to fetch bill",
    });
  }
};

module.exports = {
  getAllBills,
  getBillById,
};
