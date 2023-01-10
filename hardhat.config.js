require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const {API_URL, PRIVATE_KEY_HOST, PRIVATE_KEY_GUEST} = process.env;

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.17",
  networks: {
    hardhat: {
    },
    mumbai: {
      url: API_URL,
      accounts: [PRIVATE_KEY_HOST, PRIVATE_KEY_GUEST]
    }
  }
};
