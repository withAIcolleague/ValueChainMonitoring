import "./db/connection.js";
import express from "express";
import cors from "cors";
import compression from "compression";
import { stocksRouter } from "./routes/stocks.js";
import { relationsRouter } from "./routes/relations.js";
import { relationTypesRouter } from "./routes/relationTypes.js";
import { productsRouter, stockProductsRouter } from "./routes/products.js";
import { themesRouter, stockThemesRouter } from "./routes/themes.js";
import { stockLinksRouter } from "./routes/links.js";
import { newsRouter, manualNewsRouter } from "./routes/news.js";
import { graphRouter } from "./routes/graph.js";
import { layoutRouter } from "./routes/layout.js";
import { metaRouter } from "./routes/meta.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();
const PORT = Number(process.env.PORT ?? 4000);

app.use(cors());
app.use(compression());
app.use(express.json());

app.use("/api/stocks/:id/products", stockProductsRouter);
app.use("/api/stocks/:id/themes", stockThemesRouter);
app.use("/api/stocks/:id/links", stockLinksRouter);
app.use("/api/stocks/:id/news", manualNewsRouter);
app.use("/api/stocks", stocksRouter);

app.use("/api/relations", relationsRouter);
app.use("/api/relation-types", relationTypesRouter);
app.use("/api/products", productsRouter);
app.use("/api/themes", themesRouter);
app.use("/api/news", newsRouter);
app.use("/api/graph", graphRouter);
app.use("/api/layout", layoutRouter);
app.use("/api/meta", metaRouter);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`ValueChainMonitoring API listening on http://localhost:${PORT}`);
});
