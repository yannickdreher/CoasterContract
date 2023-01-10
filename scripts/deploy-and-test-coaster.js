const { ethers } = require("hardhat");
const { formatEther, parseUnits } = ethers.utils;

async function main() {
  const [hostSigner, guestSigner] = await ethers.getSigners();
  const guestAlias = "Yannick";
  const debtsLimit = parseUnits("100", 18);

  async function deployTurnersTestToken() {
    const contractFactory = await ethers.getContractFactory("TestToken");
    const contract = await contractFactory.deploy();
    await contract.deployed();
    console.log(`Deployed token to: ${contract.address}`);

    let tx;
    tx = await contract.issueToken(2000);
    await tx.wait();

    tx = await contract.transfer(guestSigner.address, parseUnits("1000", 18));
    await tx.wait();

    let hostBalance  = await contract.balanceOf(hostSigner.address);
    let guestBalance = await contract.balanceOf(guestSigner.address);
    console.log(`\tHost  balance: ${hostBalance}`);
    console.log(`\tGuset balance: ${guestBalance}`);

    return contract;
  }

  const token = await deployTurnersTestToken();

  async function deployCoaster() {
    const contractFactory = await ethers.getContractFactory("Coaster");
    const contract = await contractFactory.deploy(token.address, guestSigner.address, guestAlias, debtsLimit);
    await contract.deployed();
    console.log(`Deployed coaster to: ${contract.address}`);
    return contract;
  }

  const coaster = await deployCoaster()

  async function subscribeToEvents() {
    console.log(`Subscribe to events`);

    coaster.on("DebtsAdded", (amount, productName, productPrice, totalDebts, timestamp) => {
      console.log(`DebtsAdded event: amount=${amount} productName=${productName} productPrice=${formatEther(productPrice)} totalDebts=${formatEther(totalDebts)} ${new Date(timestamp * 1000).toISOString()}`);
    });
    console.log(`\tSubscribed to: DebtsAdded`);

    coaster.on("DebtsPayed", (amount, remainingDebts, timestamp) => {
      console.log(`DebtsPayed event: amount=${formatEther(amount)} remainingDebts=${formatEther(remainingDebts)} ${new Date(timestamp * 1000).toISOString()}`);
    });
    console.log(`\tSubscribed to: DebtsPayed`);

    coaster.on("DebtsCollected", (amount, remainingDebts, timestamp) => {
      console.log(`DebtsCollected event: amount=${formatEther(amount)} remainingDebts=${formatEther(remainingDebts)} ${new Date(timestamp * 1000).toISOString()}`);
    });
    console.log(`\tSubscribed to: DebtsCollected`);

    coaster.on("AllowanceRequest", (to, amount, timestamp) => {
      console.log(`AllowanceRequest event: to=${to} amount=${formatEther(amount)} ${new Date(timestamp * 1000).toISOString()}`);
    });
    console.log(`\tSubscribed to: AllowanceRequest`);

    coaster.on("Terminated", (timestamp) => {
      console.log(`Terminated event: ${new Date(timestamp * 1000).toISOString()}`);
    });
    console.log(`\tSubscribed to: Terminated`);
    console.log();
  }

  async function getCoasterProperties() {
    let owner = await coaster.owner();
    let guest = await coaster.guest();
    let guestAlias  = await coaster.guestAlias();
    let debtsAmount = formatEther(await coaster.debtsAmount());
    let debtLimit   = formatEther(await coaster.debtsLimit());
    let created     = new Date(await coaster.created() * 1000);
    let status      = await coaster.status();
    let balance     = formatEther(await token.balanceOf(coaster.address));

    console.log(`Coaster properties`);
    console.log(`\towner: ${owner}`);
    console.log(`\tguest: ${guest}`);
    console.log(`\tguestAlias: ${guestAlias}`);
    console.log(`\tdebtsAmount: ${debtsAmount}`);
    console.log(`\tdebtsLimit: ${debtLimit}`);
    console.log(`\tcreated: ${created.toISOString()}`);
    console.log(`\tstatus: ${status}`);
    console.log(`\tbalance: ${balance}`);
    console.log();
  }

  async function addDebts(amount) {
    console.log(`Adding debts`);
    console.log(`\tamount: ${amount}`);

    const productName = "Beer";
    const productPrice = parseUnits("1.5", 18);

    let tx;

    for(let i = 0; i < amount; i++) {
      let amount = Math.floor(Math.random() * 4);
      tx = await coaster.addDebts(amount, productName, productPrice);
      await tx.wait();
    }

    console.log();
  }

  async function queryDebtsAddedHistory() {
    console.log(`Get debts added event history`);
    let filter = coaster.filters.DebtsAdded();
    let events = await coaster.queryFilter(filter);

    for(let i = 0; i < events.length; i++) {
      let event = events[i];

      let blockNumber = event.blockNumber;
      let logIndex = event.logIndex;
      let productName = event.args.productName;
      let productPrice = formatEther(event.args.productPrice);
      let totalDebts = formatEther(event.args.totalDebts);
      let timestamp = new Date(event.args.timestamp * 1000);

      console.log(`\tBlock No: ${blockNumber} Index: ${logIndex} Product: ${productName} Price: ${productPrice} TotalDebts: ${totalDebts} DateTime: ${timestamp.toISOString()}`);
    }

    console.log();
  }

  async function payDebts(amount) {
    console.log(`Pay debts`);

    amount = parseUnits(amount, 18);
    console.log(`\tamount: ${amount}`);

    let tx = await coaster.connect(guestSigner).payDebts(amount);
    await tx.wait();

    console.log();
  }

  async function approveForCoaster(amount) {
    console.log(`Approve for coaster`);

    amount = parseUnits(amount, 18);
    let tx = await token.connect(guestSigner).approve(coaster.address, amount);
    await tx.wait();
  }

  async function collectDebts() {
    console.log(`Collect debts`);
    let tx = await coaster.connect(hostSigner).collectDebts();
    await tx.wait();
  }

  async function withdraw() {
    console.log(`Withdraw`);
    let tx = await coaster.connect(hostSigner).withdraw();
    await tx.wait();
  }

  await subscribeToEvents();
  await getCoasterProperties();
  await addDebts(2);
  await getCoasterProperties();
  await queryDebtsAddedHistory();
  //await payDebts("10");
  await getCoasterProperties();
  await collectDebts();
  await approveForCoaster("100");
  //await collectDebts();
  await payDebts("1.5");
  await getCoasterProperties();
  await collectDebts();
  await withdraw()
  await getCoasterProperties();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
