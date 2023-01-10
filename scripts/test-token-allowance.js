// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");
const contractJson = require("../artifacts/contracts/TurnersTestToken.sol/TurnersTestToken.json");
const contractAbi = contractJson.abi;

async function main() {
  const alchemy = new hre.ethers.providers.AlchemyProvider('maticmum', process.env.ALCHEMY_API_KEY);
  const wallet = new hre.ethers.Wallet(process.env.PRIVATE_KEY, alchemy);
  const contract = new hre.ethers.Contract('0x39AfBB72975638A9B19E24b0E6dfDF1B989AE954', contractAbi, wallet)

  console.log(await contract.allowance('0x2ED71B03cFbB355C2cDD0286e39973E2c6252199', '0xf918DF74Ed8021F95aa2a1d5FC3Da814fe412195'));
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
