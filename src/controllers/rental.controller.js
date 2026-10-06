const rentalService = require("../services/rental.service");
const createRental = async (req, res) => {
    try {

        const { customerId, startDate, endDate, notes, items } = req.body;

        if (!customerId || !startDate) {
            return res.status(400).json({
                success: false,
                message: "customerId, startDate  are required"
            })
        }

        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: "At least one material is required"
            });
        }

        for (const item of items) {
            if (!item.materialId || item.quantity === undefined) {
                return res.status(400).json({
                    success: false,
                    message: "Each item must have materialId and quantity"
                });
            }
            if (!Number.isInteger(Number(item.quantity)) || Number(item.quantity) <= 0) {
                return res.status(400).json({
                    success: false,
                    message: "Quantity must be a positive integer"
                });
            }
        }


        const rental = await rentalService.createRental({
            customerId,
            startDate,
            endDate: endDate || null,
            notes,
            items
        })


        return res.status(200).json({
            success: true,
            message: "Rental created successfully",
            rental
        })

    } catch (error) {
        console.log("create rental error", error)
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        })
    }
}

const getAllRentals = async (req, res) => {
    try {
        const { page, limit, search, status } = req.query
        const limitNumber = Number(limit) || 10;
        const pageNumber = Number(page) || 1;
        const rentalData = await rentalService.getAllRentals(
            pageNumber, limitNumber, search || "", status || ""
        )

        return res.status(200).json({
            success: true,
            message: "Rental fetched successfully",
            rentalData
        })

    } catch (error) {
        console.log("get rental error", error)
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        })

    }
}

const getRentalById = async (req, res) => {
    try {
        const { id } = req.params;
        const rental = await rentalService.getRentalById(id)
        if (!rental) {
            return res.status(400).json({
                success: false,
                message: "Rental id is required"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Rental fetched successfully",
            rental
        });

    } catch (error) {
        console.log("get rental by id error", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });

    }
}
module.exports = {
    createRental,
    getAllRentals,
    getRentalById
}