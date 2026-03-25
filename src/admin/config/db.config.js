const mongoose = require("mongoose");

exports.connect = () => {
 mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });


  const connection = mongoose.connection;

  connection.on("connected", () => {
    console.log(`✅ Connected to MongoDB Atlas`);
  });

  connection.on("error", (err) => {
    console.error(`❌ MongoDB connection error: ${err}`);
    process.exit(1);
  });

  return connection;
};