const { expect, assert } = require("chai");
const { network } = require("hardhat");
const {
    russianRoulette,
    russianRouletteNFT,
    BigNumber,
    generateRussianRouletteNumbers
} = require("./russianRouletteSettings.js");

describe("Russian roulette contract", function () {
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

    beforeEach(async () => {
        // Getting the signers provided by ethers
        const signers = await ethers.getSigners();
        // Creating the active wallets for use
        owner = signers[0];
        buyer = signers[1];

        // Getting the russian roulette code (abi, bytecode, name)
        russianRouletteContract = await ethers.getContractFactory("RussianRoulette");
        // Getting the russian roulette NFT code (abi, bytecode, name)
        russianRouletteNftContract = await ethers.getContractFactory("RussianRouletteNFT");
        // Getting the mock erc20 code
        mock_erc20Contract = await ethers.getContractFactory("Mock_erc20");
        // Getting the timer code (abi, bytecode, name)
        timerContract = await ethers.getContractFactory("Timer");
        // Getting the ChainLink contracts code (abi, bytecode, name)
        randGenContract = await ethers.getContractFactory("RandomNumberGenerator");
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
    });

    describe("Creating a new russian roulette test", function () {
        it("Nominal case", async function () {
            let currentTime = await russianRouletteInstance.getCurrentTime();
            let timeStamp = new BigNumber(currentTime.toString());
            await expect(
                russianRouletteInstance.connect(owner).createNewRussianRoulette(
                    russianRoulette.newRussianRoulette.prize,
                    russianRoulette.newRussianRoulette.cost,
                    timeStamp.toString(),
                    timeStamp.plus(russianRoulette.newRussianRoulette.closeIncrease).toString(),
                )
            ).to.emit(russianRouletteInstance, russianRoulette.events.new)
                .withArgs(
                    1,
                    0
                );
        });
        /**
         * Testing that non-admins cannot create a russian roulette game
         */
        it("Invalid admin", async function () {
            // Getting the current block timestamp
            let currentTime = await russianRouletteInstance.getCurrentTime();
            // Converting to a BigNumber for manipulation 
            let timeStamp = new BigNumber(currentTime.toString());
            // Checking call reverts with correct error message
            await expect(
                russianRouletteInstance.connect(buyer).createNewRussianRoulette(
                    russianRoulette.newRussianRoulette.prize,
                    russianRoulette.newRussianRoulette.cost,
                    timeStamp.toString(),
                    timeStamp.plus(russianRoulette.newRussianRoulette.closeIncrease).toString()
                )
            ).to.be.revertedWith(russianRoulette.errors.invalid_admin);
        });
    });
});















