const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const { ethers } = require("hardhat");

const limit = ethers.utils.parseUnits("100", 18);
const productName = "Beer";
const productPrice = ethers.utils.parseUnits("1.5", 18);

describe("Coaster", function () { 
  async function deployTurnersTestTokenFixture() {
    const contractFactory = await ethers.getContractFactory("TestToken");
    const token = await contractFactory.deploy();
    return token;
  }

  async function deployCoasterFixture() {
    const token = await deployTurnersTestTokenFixture();
    const [host, guest] = await ethers.getSigners();

    const contractFactory = await ethers.getContractFactory("Coaster");
    const coaster = await contractFactory.deploy(token.address, guest.address, limit);

    return { coaster, host, guest, token };
  }

  describe("Deployment chacks", function () {
    it("Should set the right owner", async function () {
      const { coaster, host } = await loadFixture(deployCoasterFixture);
      expect(await coaster.owner()).to.equal(host.address);
    });

    it("Should set the right guest", async function () {
      const { coaster, host, guest } = await loadFixture(deployCoasterFixture);
      expect(await coaster.guest()).to.equal(guest.address);
    });

    it("Should set the right debtsLimit", async function () {
      const { coaster } = await loadFixture(deployCoasterFixture);
      expect(await coaster.debtsLimit()).to.equal(limit);
    });

    it("Should set the right status", async function () {
      const { coaster } = await loadFixture(deployCoasterFixture);
      expect(await coaster.status()).to.equal(0);
    });
  });

  describe("Authorisation checks", function () {
    it("Should fail addDebts if the signer is not owner", async function () {
      const { coaster, host, guest } = await loadFixture(deployCoasterFixture);
      expect(coaster.connect(guest).addDebts(productName, productPrice)).to.be.revertedWith(
        "Sender not authorized."
      );
    });

    it("Should fail payDebts if the signer is not guest", async function () {
      const { coaster, host, guest } = await loadFixture(deployCoasterFixture);
      expect(coaster.connect(host).payDebts({value: limit})).to.be.revertedWith(
        "Sender not authorized."
      );
    });

    it("Should fail collectDebts if the signer is not owner", async function () {
      const { coaster, host, guest } = await loadFixture(deployCoasterFixture);
      expect(coaster.connect(guest).collectDebts()).to.be.revertedWith(
        "Sender not authorized."
      );
    });
  });

  describe("Events checks", function () {
    it("Should emit an event on addDebts", async function () {
      const { coaster, host, guest } = await deployCoasterFixture();
      await expect(coaster.addDebts(productName, productPrice))
        .to.emit(coaster, "DebtsAdded")
        .withArgs(productName, productPrice, anyValue, anyValue);
    });

    it("Should emit an event on payDebts", async function () {
      const { coaster, host, guest } = await loadFixture(deployCoasterFixture);
      const amount = ethers.utils.parseUnits("0.5", 18);
      await coaster.addDebts(productName, productPrice);
      await expect(coaster.connect(guest).payDebts({value: amount}))
        .to.emit(coaster, "DebtsPayed")
        .withArgs(amount, ethers.utils.parseUnits("1.0", 18), anyValue);
    });

    it("Should emit an event on collectDebts", async function () {
      const { coaster, host, guest } = await loadFixture(deployCoasterFixture);
      await coaster.addDebts(productName, productPrice);
      await expect(coaster.collectDebts())
        .to.emit(coaster, "DebtsCollected")
        .withArgs(false, anyValue, anyValue, anyValue);
    });
  });
});
