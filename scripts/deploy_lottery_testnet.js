async function main() {
    const [owner] = await ethers.getSigners();
    // Saving the info to be logged in the table (deployer address)
    var deployerLog = { Label: "Deploying Address", Info: owner.address };
    // Saving the info to be logged in the table (deployer address)
    var deployerBalanceLog = {
        Label: "Deployer Balance",
        Info: (await owner.getBalance()).toString()
    };

    const LotteryContract = await ethers.getContractFactory("Lottery.sol");

    // Getting the lotteryNFT code (abi, bytecode, name)
    const lotteryNftContract = await ethers.getContractFactory("LotteryNFT");
    // Getting the lotteryNFT code (abi, bytecode, name)
    const mock_erc20Contract = await ethers.getContractFactory("Mock_erc20");
    // Getting the timer code (abi, bytecode, name)
    const timerContract = await ethers.getContractFactory("Timer");
    // Getting the ChainLink contracts code (abi, bytecode, name)
    const randGenContract = await ethers.getContractFactory("RandomNumberGenerator");
    const mock_vrfCoordContract = await ethers.getContractFactory("Mock_VRFCoordinator");

    // const lottery_instance = await LotteryContract.deploy();

    await lottery_instance.deployed();

    console.log("Lottery deployed to:", Lottery.address);
    console.log("Lottery deployed to:", Lottery.address);
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });