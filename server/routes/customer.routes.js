// src/routes/customer.routes.js
import express from 'express';
import {
    createCustomer,
    getCustomers, // Handles both list and search
    getCustomerById,
    updateCustomer,
    deleteCustomer,
    getCustomerCredit
} from '../controllers/customer.controller.js'; // Adjust path if needed

const router = express.Router();

// Define routes for Customers
router.post('/', createCustomer);       // POST /api/customers
router.get('/', getCustomers);         // GET /api/customers (gets all or searches)
                                       // Example: GET /api/customers?search=Bob
router.get('/:id', getCustomerById);   // GET /api/customers/some-cuid
router.put('/:id', updateCustomer);    // PUT /api/customers/some-cuid
router.delete('/:id', deleteCustomer); // DELETE /api/customers/some-cuid

router.get('/:id/credit', getCustomerCredit); // GET /api/customers/some-cuid/credit

export default router;