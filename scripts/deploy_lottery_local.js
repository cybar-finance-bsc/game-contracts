const {
    local_lotto,
    lottoNFT,
    BigNumber,
} = require("./settings/lottoDeploySettings.js");
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

    // Deploys the contracts
    timerInstance = await timerContract.deploy();
    cybarInstance = await mock_erc20Contract.deploy(
        local_lotto.buy.cybar,
    );

    lotteryInstance = await lotteryContract.deploy(
        cybarInstance.address,
        timerInstance.address,
        local_lotto.setup.sizeOfLottery,
        local_lotto.setup.maxValidRange,
        local_lotto.setup.bucket.one,
        local_lotto.setup.bucket.two,
        local_lotto.setup.bucketDiscount.one,
        local_lotto.setup.bucketDiscount.two,
        local_lotto.setup.bucketDiscount.three
    );
    randGenInstance = await randGenContract.deploy(
        local_lotto.chainLink.dataFeedAddress, lotteryInstance.address
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
        local_lotto.newLotto.prize
    );

    // Getting the current block timestamp
    let currentTime = await lotteryInstance.getCurrentTime();
    // Converting to a BigNumber for manipulation 
    let timeStamp = new BigNumber(currentTime.toString());

    // Creating a new lottery
    await lotteryInstance.connect(owner).createNewLotto(
        local_lotto.newLotto.distribution,
        local_lotto.newLotto.prize,
        local_lotto.newLotto.cost,
        timeStamp.toString(),
        timeStamp.plus(local_lotto.newLotto.closeIncrease).toString()
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