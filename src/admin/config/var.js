require("dotenv").config(); //get env file based on script NODE_ENV==="cross-env" in package.json

module.exports = {
  port: process.env.PORT,
  mongo: { uri: process.env.MONGO_URI },
 
};
