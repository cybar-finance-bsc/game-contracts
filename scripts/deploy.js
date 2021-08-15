const {
    lotto,
    lottoNFT,
    BigNumber,
    generateLottoNumbers
} = require("../test/settings.js");
// The deployment script
const main = async () => {
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

    let mock_erc20Contract;
    // Creating the instance and contract info for the lottery contract
    let lotteryInstance, lotteryContract;
    // Creating the instance and contract info for the lottery NFT contract
    let lotteryNftInstance, lotteryNftContract;
    // Creating the instance and contract info for the cybar token contract
    let cybarInstance;
    // Creating the instance and contract info for the timer contract
    let timerInstance, timerContract;
    // Creating the instance and contract info for the mock rand gen
    let randGenInstance, randGenContract;
    // Creating the instance and contract of all the contracts needed to mock
    // the ChainLink contract ecosystem. 
    let linkInstance;
    let mock_vrfCoordInstance, mock_vrfCoordContract;

    // Getting the lottery code (abi, bytecode, name)
    lotteryContract = await ethers.getContractFactory("Lottery");
    // Getting the lotteryNFT code (abi, bytecode, name)
    lotteryNftContract = await ethers.getContractFactory("LotteryNFT");
    // Getting the lotteryNFT code (abi, bytecode, name)
    mock_erc20Contract = await ethers.getContractFactory("Mock_erc20");
    // Getting the timer code (abi, bytecode, name)
    timerContract = await ethers.getContractFactory("Timer");
    // Getting the ChainLink contracts code (abi, bytecode, name)
    randGenContract = await ethers.getContractFactory("RandomNumberGenerator");
    mock_vrfCoordContract = await ethers.getContractFactory("Mock_VRFCoordinator");

    // Deploys the contracts
    timerInstance = await timerContract.deploy();
    cybarInstance = await mock_erc20Contract.deploy(
        lotto.buy.cybar,
    );
    linkInstance = await mock_erc20Contract.deploy(
        lotto.buy.cybar,
    );
    mock_vrfCoordInstance = await mock_vrfCoordContract.deploy(
        linkInstance.address,
        lotto.chainLink.keyHash,
        lotto.chainLink.fee
    );
    lotteryInstance = await lotteryContract.deploy(
        cybarInstance.address,
        timerInstance.address,
        lotto.setup.sizeOfLottery,
        lotto.setup.maxValidRange,
        lotto.setup.bucket.one,
        lotto.setup.bucket.two,
        lotto.setup.bucketDiscount.one,
        lotto.setup.bucketDiscount.two,
        lotto.setup.bucketDiscount.three
    );
    randGenInstance = await randGenContract.deploy(
        mock_vrfCoordInstance.address,
        linkInstance.address,
        lotteryInstance.address,
        lotto.chainLink.keyHash,
        lotto.chainLink.fee
    );
    lotteryNftInstance = await lotteryNftContract.deploy(
        lottoNFT.newLottoNft.uri,
        lotteryInstance.address,
        timerInstance.address
    );

    // Final set up of contracts
    await lotteryInstance.initialize(
        lotteryNftInstance.address,
        randGenInstance.address
    );
    // Making sure the lottery has some cybar
    await cybarInstance.mint(
        lotteryInstance.address,
        lotto.newLotto.prize
    );
    // Sending link to lottery
    await linkInstance.transfer(
        randGenInstance.address,
        lotto.buy.cybar
    );

    // Getting the current block timestamp
    let currentTime = await lotteryInstance.getCurrentTime();
    // Converting to a BigNumber for manipulation 
    let timeStamp = new BigNumber(currentTime.toString());

    // Creating a new lottery
    await lotteryInstance.connect(owner).createNewLotto(
        lotto.newLotto.distribution,
        lotto.newLotto.prize,
        lotto.newLotto.cost,
        timeStamp.toString(),
        timeStamp.plus(lotto.newLotto.closeIncrease).toString()
    );

    let lottoInfo = await lotteryInstance.getBasicLottoInfo(1)

    // Saving the info to be logged in the table (deployer address)
    var cybarLog = { Label: "Deployed Mock Cybar Token Address", Info: cybarInstance.address };
    var lotteryLog = { Label: "Deployed Lottery Address", Info: lotteryInstance.address };
    var lotteryID = { Label: "Deployed Lottery-ID", Info: lottoInfo.lotteryID.toString() };
    var lotteryNftLog = { Label: "Deployed Lottery NFT Address", Info: lotteryNftInstance.address };

    console.table([
        deployerLog,
        deployerBalanceLog,
        buyerLog,
        cybarLog,
        lotteryLog,
        lotteryID,
        lotteryNftLog
    ]);
}
// Runs the deployment script, catching any errors
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });