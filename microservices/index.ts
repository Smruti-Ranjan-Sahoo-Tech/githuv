// import "./services/tex-to-pdf/index.ts";

import express from "express";
import compileRoute from "./src/Route/compile";

const app = express();

app.use(
  express.json({
    limit: "5mb",
  })
);

app.use("/", compileRoute);

app.listen(3005, () => {
  console.log(
    "PDF Service running on port 3005"
  );
});