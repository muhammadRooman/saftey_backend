const mongoose = require("mongoose");

exports.connect = () => {
  
    mongoose.connect("mongodb+srv://muhammadrooman:Rooman123@cluster0.qfqum5j.mongodb.net/TestingProject?retryWrites=true&w=majority", {
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
