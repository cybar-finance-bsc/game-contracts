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
        /**
         * Testing that non-admins cannot create a russian roulette game
         */
        it("Invalid prize", async function () {
            // Getting the current block timestamp
            let currentTime = await russianRouletteInstance.getCurrentTime();
            // Converting to a BigNumber for manipulation 
            let timeStamp = new BigNumber(currentTime.toString());
            // Checking call reverts with correct error message
            await expect(
                russianRouletteInstance.connect(owner).createNewRussianRoulette(
                    russianRoulette.errorData.prize,
                    russianRoulette.newRussianRoulette.cost,
                    timeStamp.toString(),
                    timeStamp.plus(russianRoulette.newRussianRoulette.closeIncrease).toString()
                )
            ).to.be.revertedWith(russianRoulette.errors.invalid_price_or_cost);
        });
        it("Invalid cost", async function () {
            // Getting the current block timestamp
            let currentTime = await russianRouletteInstance.getCurrentTime();
            // Converting to a BigNumber for manipulation 
            let timeStamp = new BigNumber(currentTime.toString());
            // Checking call reverts with correct error message
            await expect(
                russianRouletteInstance.connect(owner).createNewRussianRoulette(
                    russianRoulette.newRussianRoulette.prize,
                    russianRoulette.errorData.cost,
                    timeStamp.toString(),
                    timeStamp.plus(russianRoulette.newRussianRoulette.closeIncrease).toString()
                )
            ).to.be.revertedWith(russianRoulette.errors.invalid_price_or_cost);
        });
        it("Invalid timestamp order", async function () {
            // Getting the current block timestamp
            let currentTime = await russianRouletteInstance.getCurrentTime();
            // Converting to a BigNumber for manipulation 
            let timeStamp = new BigNumber(currentTime.toString());
            // Checking call reverts with correct error message
            await expect(
                russianRouletteInstance.connect(owner).createNewRussianRoulette(
                    russianRoulette.newRussianRoulette.prize,
                    russianRoulette.newRussianRoulette.cost,
                    timeStamp.toString(),
                    timeStamp.minus(russianRoulette.newRussianRoulette.closeIncrease).toString()
                )
            ).to.be.revertedWith(russianRoulette.errors.invalid_timestamp);
        });
    });
    describe("Buying tickets tests", function () {
        beforeEach(async () => {
            // Getting the current block timestamp
            let currentTime = await russianRouletteInstance.getCurrentTime();
            // Converting to a BigNumber for manipulation 
            let timeStamp = new BigNumber(currentTime.toString());
            // Creating a new lottery
            await russianRouletteInstance.connect(owner).createNewRussianRoulette(
                russianRoulette.newRussianRoulette.prize,
                russianRoulette.newRussianRoulette.cost,
                timeStamp.toString(),
                timeStamp.plus(russianRoulette.newRussianRoulette.closeIncrease).toString()
            );
        });
        it("View cost per ticket", async function () {
            let totalPrice = await russianRouletteInstance.costToBuyTickets(
                1,
                10
            );
            // Works back from totalPrice to one token cost
            let check = BigNumber(totalPrice.toString());
            let noOfTickets = new BigNumber(10);
            let oneCost = check.div(noOfTickets);
            // Checks price is correct
            assert.equal(
                oneCost.toString(),
                russianRoulette.newRussianRoulette.cost.toString(),
                "Incorrect ost for batch buy of 10 equals cost times 10"
            );
        });
        it("Checking all possible numbers", async function () {
            let price = await russianRouletteInstance.costToBuyTickets(
                1,
                russianRoulette.setup.maxValidRange
            );
            let ticketNumbers = [... Array(russianRoulette.setup.maxValidRange).keys()];
            await cybarInstance.connect(owner).approve(
                russianRouletteInstance.address,
                price
            );
            await russianRouletteInstance.connect(owner).batchBuyRussianRouletteTicket(
                1,
                russianRoulette.setup.maxValidRange,
                ticketNumbers
            );

        })
        it("Batch buying 10 tickets", async function () {
            // Getting the price to buy
            let price = await russianRouletteInstance.costToBuyTickets(
                1,
                10
            );
            // Generating chosen numbers for buy
            let ticketNumbers = generateRussianRouletteNumbers({
                numberOfTickets: 10,
                maxRange: russianRoulette.setup.maxValidRange
            });
            // Approving russian roulette to spend cost
            await cybarInstance.connect(owner).approve(
                russianRouletteInstance.address,
                price
            );
            // Batch buying tokens
            await russianRouletteInstance.connect(owner).batchBuyRussianRouletteTicket(
                1,
                10,
                ticketNumbers
            );
            // Testing results
            // TODO get user balances
            assert.equal(
                price.toString(),
                russianRoulette.buy.ten.cost,
                "Incorrect cost for batch buy of 10"
            );
        });
    });
});















