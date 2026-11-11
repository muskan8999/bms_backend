const prisma = require("../config/prisma");

    const createRental = async (rentalData) => {
        return await prisma.$transaction(async (tx) => {
            const customer = await tx.customer.findUnique({
                where: {
                    id: rentalData.customerId
                }
            });
            if (!customer) {
                throw new Error("customer not found")
            }


            const startDate = new Date(rentalData.startDate);
            if (Number.isNaN(startDate.getTime())) {
                throw new Error("Invalid issue date");
            }
            const endDate = rentalData.endDate
                ? new Date(rentalData.endDate)
                : null;

            if (endDate && Number.isNaN(endDate.getTime())) {
                throw new Error("Invalid end date");
            }

            if (!Array.isArray(rentalData.items) || rentalData.items.length === 0) {
                throw new Error("At least one material is required");
            }


            const rental = await tx.rental.create({
                data: {
                    customerId: rentalData.customerId,
                    startDate: startDate,
                    endDate: endDate,
                    totalAmount: null,
                    notes: rentalData.notes || null
                }
            });

            for (const item of rentalData.items) {
                const material = await tx.material.findUnique({
                    where: {
                        id: item.materialId
                    }
                })

                if (!material || !material.isActive) {
                    throw new Error("Active material not found");
                }

                if (item.quantity <= 0) {
                    throw new Error("Quantity must be greater than 0");
                }

                if (item.quantity > material.availableUnits) {
                    throw new Error(
                        `Requested quantity for ${material.name} is not available`
                    );
                }

                const dailyRentalRate = Number(material.dailyRentalRate);

                // Create rental item
                await tx.rentalItem.create({
                    data: {
                        rentalId: rental.id,
                        materialId: item.materialId,
                        quantity: item.quantity,
                        dailyRentalRate
                    }
                });
                await tx.material.update({
                    where: {
                        id: item.materialId
                    },
                    data: {
                        availableUnits: {
                            decrement: item.quantity
                        }
                    }
                });
            }


            return await tx.rental.findUnique({
                where: {
                    id: rental.id,
                },
                include: {
                    customer: true,
                    items: {
                        include: {
                            material: true
                        }
                    }
                }
            })
        })
    }

const getAllRentals = async (page = 1, limit = 10, search = "", status = "") => {

    const skip = (page - 1) * limit
    const where = {
        ...(status ? { status } : {}),
        ...(search ? {
            OR: [
                {
                    customer: {
                        name: {
                            contains: search,
                            mode: "insensitive"
                        }
                    },
                },
                {
                    items:{
                        some:{
                            material: {
                                name: {
                                    contains: search,
                                    mode: "insensitive"
                                }
        
                            }

                        }
                    }
                }
            ]
        } : {})
    };

    const [rentals, totalRentals] = await Promise.all([
        prisma.rental.findMany({
            where,
            skip,
            take: limit,
            orderBy: {
                createdAt: "desc"
            },
            include: {
                customer: true,
                items:{
                    include:{
                        material:true
                    }
                }
            }
        }),
        prisma.rental.count({
            where
        })
    ]);

    return {
        rentals,
        totalRentals,
        totalPages: Math.ceil(totalRentals / limit),
        currentPage: page

    }

}

const getRentalById = async(id)=>{
    const rental = await prisma.rental.findUnique({
        where: {
            id 
        },
        include:{
            customer: true,
            items:{
                include:{
                    material:true
                }
            }
        }
    })
    if(!rental){
        throw new Error("Rental not found")
    }
    return rental;
}


const returnRental = async (rentalId, returnData) => {
    return await prisma.$transaction(async (tx) => {

        // 1. Find rental with all items
        const rental = await tx.rental.findUnique({
            where: { id: rentalId },
            include: {
                items: {
                    include: {
                        material: true
                    }
                }
            }
        });

        if (!rental) {
            throw new Error("Rental not found");
        }

        if (rental.status !== "ACTIVE") {
            throw new Error("Rental is not active");
        }

        // 2. Validate return date
        const returnDate = new Date(returnData.returnDate);

        if (Number.isNaN(returnDate.getTime())) {
            throw new Error("Invalid return date");
        }

        if (returnDate < rental.startDate) {
            throw new Error("Return date cannot be before rental start date");
        }

        // Prevent backdated returns
        const latestReturn = await tx.rentalReturn.findFirst({
            where: { rentalId },
            orderBy: { returnDate: "desc" }
        });

        if (latestReturn && returnDate < latestReturn.returnDate) {
            throw new Error("Return date cannot be before previous return date");
        }

        if (!Array.isArray(returnData.items) || returnData.items.length === 0) {
            throw new Error("At least one return item is required");
        }

        // 3. Validate all return quantities before updating anything
        const returnItems = [];
        const seenMaterials = new Set();

        for (const item of returnData.items) {

            if (!Number.isInteger(Number(item.quantity)) ||
                Number(item.quantity) <= 0) {
                throw new Error("Return quantity must be a positive integer");
            }

            if (seenMaterials.has(item.materialId)) {
                throw new Error("Duplicate material in return request");
            }

            seenMaterials.add(item.materialId);

            const rentalItem = rental.items.find(
                (ri) => ri.materialId === item.materialId
            );

            if (!rentalItem) {
                throw new Error("Material does not belong to this rental");
            }

            const quantity = Number(item.quantity);

            const remainingQuantity =
                rentalItem.quantity - rentalItem.returnedQuantity;

            if (quantity > remainingQuantity) {
                throw new Error(
                    `Only ${remainingQuantity} units of ${rentalItem.material.name} can be returned`
                );
            }

            returnItems.push({
                rentalItem,
                quantity
            });
        }

        // 4. Validate charges
        const damageCharges = Number(returnData.damageCharges || 0);
        const additionalCharges = Number(returnData.additionalCharges || 0);
        const discount = Number(returnData.discount || 0);

        for (const charge of [damageCharges, additionalCharges, discount]) {
            if (!Number.isFinite(charge) || charge < 0) {
                throw new Error("Charges and discount must be valid non-negative numbers");
            }
        }

        // 5. Create return history
        const returnRecord = await tx.rentalReturn.create({
            data: {
                rentalId,
                returnDate,
                damageCharges,
                additionalCharges,
                discount,
                notes: returnData.notes || null,

                items: {
                    create: returnItems.map(({ rentalItem, quantity }) => ({
                        rentalItemId: rentalItem.id,
                        quantity
                    }))
                }
            }
        });

        // 6. Update returned quantities and available stock
        for (const { rentalItem, quantity } of returnItems) {

            // Conditional update protects against over-returning
            const updated = await tx.rentalItem.updateMany({
                where: {
                    id: rentalItem.id,
                    returnedQuantity: {
                        lte: rentalItem.quantity - quantity
                    }
                },
                data: {
                    returnedQuantity: {
                        increment: quantity
                    }
                }
            });

            if (updated.count !== 1) {
                throw new Error("Return quantity changed. Please try again.");
            }

            await tx.material.update({
                where: {
                    id: rentalItem.materialId
                },
                data: {
                    availableUnits: {
                        increment: quantity
                    }
                }
            });
        }

        // 7. Check whether everything has been returned
        const updatedRentalItems = await tx.rentalItem.findMany({
            where: { rentalId }
        });

        const fullyReturned = updatedRentalItems.every(
            (item) => item.returnedQuantity === item.quantity
        );

        // 8. If partial return, keep rental active
        if (!fullyReturned) {
            return {
                fullyReturned: false,
                returnRecord,
                rental: await tx.rental.findUnique({
                    where: { id: rentalId },
                    include: {
                        customer: true,
                        items: {
                            include: { material: true }
                        }
                    }
                })
            };
        }

        // 9. Calculate final rental amount
        // Use cents internally to avoid floating-point currency errors
        const toCents = (value) => Math.round(Number(value) * 100);

        const daysBetween = (start, end) => {
            const startDay = Date.UTC(
                start.getUTCFullYear(),
                start.getUTCMonth(),
                start.getUTCDate()
            );

            const endDay = Date.UTC(
                end.getUTCFullYear(),
                end.getUTCMonth(),
                end.getUTCDate()
            );

            return Math.max(
                1,
                Math.ceil((endDay - startDay) / 86400000)
            );
        };

        // Get every return transaction with its returned items
        const allReturns = await tx.rentalReturn.findMany({
            where: { rentalId },
            include: {
                items: {
                    include: {
                        rentalItem: true
                    }
                }
            }
        });

        let subtotalCents = 0;

        for (const record of allReturns) {

            const days = daysBetween(
                rental.startDate,
                record.returnDate
            );

            for (const returnedItem of record.items) {

                const rateCents = toCents(
                    returnedItem.rentalItem.dailyRentalRate
                );

                const amountCents =
                    returnedItem.quantity * rateCents * days;

                subtotalCents += amountCents;
            }
        }

        // 10. Accumulate all adjustments
        const totalDamageCents = allReturns.reduce(
            (sum, record) => sum + toCents(record.damageCharges),
            0
        );

        const totalAdditionalCents = allReturns.reduce(
            (sum, record) => sum + toCents(record.additionalCharges),
            0
        );

        const totalDiscountCents = allReturns.reduce(
            (sum, record) => sum + toCents(record.discount),
            0
        );

        const grossCents =
            subtotalCents + totalDamageCents + totalAdditionalCents;

        if (totalDiscountCents > grossCents) {
            throw new Error("Discount cannot be greater than the final bill");
        }

        const totalAmountCents = grossCents - totalDiscountCents;

        const totalAmount = totalAmountCents / 100;

        // 11. Complete rental and save final amount
        const completedRental = await tx.rental.update({
            where: { id: rentalId },
            data: {
                endDate: returnDate,
                totalAmount,
                status: "COMPLETED"
            },
            include: {
                customer: true,
                items: {
                    include: { material: true }
                }
            }
        });

        return {
            fullyReturned: true,
            returnRecord,
            rental: completedRental,
            bill: {
                subtotal: subtotalCents / 100,
                damageCharges: totalDamageCents / 100,
                additionalCharges: totalAdditionalCents / 100,
                discount: totalDiscountCents / 100,
                totalAmount
            }
        };
    });
};



module.exports = {
    createRental,
    getAllRentals,
    getRentalById,
    returnRental
}