const mongoose = require("mongoose");

exports.connect = () => {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error("❌ MONGO_URI is missing. Add it in backend/.env");
    process.exit(1);
  }

  mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  const connection = mongoose.connection;

  connection.on("connected", () => {
    console.log(`✅ Connected to MongoDB`);
  });

  connection.on("error", (err) => {
    console.error(`❌ MongoDB connection error: ${err}`);
    process.exit(1);
  });

  return connection;
};
