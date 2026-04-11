import express from "express";
import "dotenv/config";
import cors from "cors";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { errorHandler, notFound } from "./middleware/errorHandler.js";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDistPath = path.resolve(__dirname, "../client/dist");
const clientIndexPath = path.join(clientDistPath, "index.html");
const hasClientBuild = fs.existsSync(clientIndexPath);

const corsOrigin = process.env.CORS_ORIGIN;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
if (corsOrigin) {
  const allowList = corsOrigin
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.use(
    cors({
      origin: allowList,
      credentials: true,
    })
  );
} else {
  app.use(cors());
}

app.get("/api/health", (req, res) => {
  res.status(200).json({ ok: true, uptime: process.uptime() });
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

app.use("/api", notFound);

// Error handler middleware (must be last)
app.use(errorHandler);

if (hasClientBuild) {
  app.use(express.static(clientDistPath));

  app.get("/{*splat}", (req, res, next) => {
    if (req.path.startsWith("/api")) {
      return next();
    }
    return res.sendFile(clientIndexPath);
  });
} else {
  app.get("/", (req, res) => {
    res.status(200).send("API is running. Build client with: npm --prefix ../client run build");
  });
}

const port = process.env.PORT || 3000;
const host = process.env.HOST || "0.0.0.0";
app.listen(port, host, () => {
  console.log(`Server is running on http://${host}:${port}`);
  if (hasClientBuild) {
    console.log("Serving frontend from client/dist");
  }
});
