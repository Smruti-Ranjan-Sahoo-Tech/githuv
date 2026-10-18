import express from "express";
import compileRoute from "./src/Route/compile";

const app = express();

app.use(
  express.json({
    limit: "5mb",
  })
);

app.get("/test", (_req, res) => {
  res.status(200).json({ status: "ok", service: "pdf-service" });
});

app.use("/", compileRoute);

app.listen(3005, () => {
  console.log(
    "PDF Service running on port 3005"
  );
});