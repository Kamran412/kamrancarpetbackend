import dotenv from "dotenv";
dotenv.config();

import app from "@/app";

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`🚀 Kamran Carpets API listening on port ${PORT} [${process.env.NODE_ENV ?? "development"}]`);
});
