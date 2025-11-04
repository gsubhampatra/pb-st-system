import express from "express";
import "dotenv/config";
import cors from "cors";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.get("/", (req, res) => {
  res.send("Hello World!");
});

//router imports
import itemRoutes from "./routes/item.routes.js";
import supplierRoutes from "./routes/supplier.routes.js";
import purchaseRoutes from "./routes/purchase.routes.js";
import customerRoutes from "./routes/customer.routes.js";
import saleRoutes from "./routes/sale.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import receiptRoutes from "./routes/receipt.routes.js";
import accountRoutes from "./routes/account.routes.js";
import reportRoutes from "./routes/report.routes.js";
import printRoutes from "./routes/print.routes.js";
import databaseRoutes from "./routes/database.routes.js";

//routes
app.use("/api/items", itemRoutes);
app.use("/api/suppliers", supplierRoutes);
app.use("/api/purchases", purchaseRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/sales", saleRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/receipts", receiptRoutes);
app.use("/api/accounts", accountRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/print", printRoutes);
app.use("/api/database", databaseRoutes);

// Error handler middleware (must be last)
app.use(errorHandler);

const port = process.env.PORT || 3000;
app.listen(port,  () => {
  console.log(`Server is running on port ${port}`);
});
