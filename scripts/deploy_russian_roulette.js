const {
    russianRoulette,
    russianRouletteNFT,
    BigNumber,
    generateRussianRouletteNumbers
} = require("../test/russianRouletteSettings.js");
// The deployment script
const main = async () => {
    // Deploy the contract
    let mock_erc20Contract;
    // Creating the instance and contract info for the russian roulette contract
    let russianRouletteInstance, russianRouletteContract;
    // Creating the instance and contract info for the russian roulette NFT contract
    let russianRouletteNftInstance, russianRouletteNftContract;
    // Creating the instance and conatract info for the cybar token contract
    let cybarInstance;
    // Creating the instance and contract info for the timer contract
    let timerInstance, timerContract;
    // Creating the instance and contract info for the mock rand gen
    let randGenInstance, randGenContract;
    // Creating the instance and contract of all the contracts needed to mock
    // the ChainLink contract ecosystem.
    let linkInstance;
    let mock_vrfCoordInstance, mock_vrfCoordContract;

    // Creating the users
    let owner, buyer;
    const signers = await ethers.getSigners();
    // Creating the active wallets for use
    owner = signers[0];
    buyer = signers[1];
    // Saving the info to be logged in the table (deployer address)
    var deployerLog = { Label: "Deploying Address", Info: owner.address };
    var buyerLog = { Label: "Buyer Address", Info: buyer.address };
    // Saving the info to be logged in the table (deployer address)
    var deployerBalanceLog = {
        Label: "Deployer ETH Balance",
        Info: (await owner.getBalance()).toString()
    };

    // Getting the russian roulette code (abi, bytecode, name)
    russianRouletteContract = await ethers.getContractFactory("RussianRoulette");
    // Getting the russian roulette NFT code (abi, bytecode, name)
    russianRouletteNftContract = await ethers.getContractFactory("RussianRouletteNFT");
    // Getting the mock erc20 code
    mock_erc20Contract = await ethers.getContractFactory("Mock_erc20");
    // Getting the timer code (abi, bytecode, name)
    timerContract = await ethers.getContractFactory("Timer");
    // Getting the ChainLink contracts code (abi, bytecode, name)
    randGenContract = await ethers.getContractFactory("RandomNumberGeneratorRR");
    mock_vrfCoordContract = await ethers.getContractFactory("Mock_VRFCoordinator");

    // Deploying the instances
    timerInstance = await timerContract.deploy();
    cybarInstance = await mock_erc20Contract.deploy(
        russianRoulette.buy.cybar
    );
    linkInstance = await mock_erc20Contract.deploy(
        russianRoulette.buy.cybar
    );
    mock_vrfCoordInstance = await mock_vrfCoordContract.deploy(
        linkInstance.address,
        russianRoulette.chainLink.keyHash,
        russianRoulette.chainLink.fee
    );
    russianRouletteInstance = await russianRouletteContract.deploy(
        cybarInstance.address,
        timerInstance.address,
        russianRoulette.setup.maxValidRange,
    );
    randGenInstance = await randGenContract.deploy(
        mock_vrfCoordInstance.address,
        linkInstance.address,
        russianRouletteInstance.address,
        russianRoulette.chainLink.keyHash,
        russianRoulette.chainLink.fee
    );
    russianRouletteNftInstance = await russianRouletteNftContract.deploy(
        russianRouletteNFT.newRussianRouletteNft.uri,
        russianRouletteInstance.address,
        timerInstance.address
    );
    await russianRouletteInstance.initialize(
        russianRouletteNftInstance.address,
        randGenInstance.address
    );
    await cybarInstance.mint(
        russianRouletteInstance.address,
        russianRoulette.newRussianRoulette.prize
    );
    await linkInstance.transfer(
        randGenInstance.address,
        russianRoulette.buy.cybar
    );

    // Getting the current block timestamp
    let currentTime = await russianRouletteInstance.getCurrentTime();
    // Converting to a BigNumber for manipulation 
    let timeStamp = new BigNumber(currentTime.toString());

    // Creating a new lottery
    await russianRouletteInstance.connect(owner).createNewRussianRoulette(
        russianRoulette.newRussianRoulette.prize,
        russianRoulette.newRussianRoulette.cost,
        timeStamp.toString(),
        timeStamp.plus(russianRoulette.newRussianRoulette.closeIncrease).toString(),
    );

    let russianRouletteInfo = await russianRouletteInstance.getBasicRussianRouletteInfo(1)

    // Saving the info to be logged in the table (deployer address)
    var cybarLog = { Label: "Deployed Mock Cybar Token Address", Info: cybarInstance.address };
    var russianRouletteLog = { Label: "Deployed russian Roulette Address", Info: russianRouletteInstance.address };
    var russianRouletteID = { Label: "Deployed russian Roulette-ID", Info: russianRouletteInfo.russianRouletteId.toString() };
    var russianRouletteNftLog = { Label: "Deployed russian Roulette NFT Address", Info: russianRouletteNftInstance.address };

    console.table([
        deployerLog,
        deployerBalanceLog,
        buyerLog,
        cybarLog,
        russianRouletteLog,
        russianRouletteID,
        russianRouletteNftLog
    ]);
}
// Runs the deployment script, catching any errors
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });