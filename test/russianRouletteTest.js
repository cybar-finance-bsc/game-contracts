const { expect, assert } = require("chai");
const { network } = require("hardhat");
const {
    russianRoulette,
    russianRouletteNFT,
    BigNumber,
    generateRussianRouletteNumbers
} = require("./settings/russianRouletteSettings.js");

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
        randGenContract = await ethers.getContractFactory("RNG_Mock");

        // Deploying the instances
        timerInstance = await timerContract.deploy();
        cybarInstance = await mock_erc20Contract.deploy(
            russianRoulette.buy.cybar
        );
        russianRouletteInstance = await russianRouletteContract.deploy(
            cybarInstance.address,
            timerInstance.address,
            russianRoulette.setup.maxValidRange,
        );
        randGenInstance = await randGenContract.deploy(
            russianRoulette.chainLink.dataFeedAddress,
            russianRouletteInstance.address
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
            // Creating a new roulette
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
                "Incorrect cost for batch buy of 10 equals cost times 10"
            );
        });
        it("Invalid ticket number zero", async function () {
            // Getting the price to buy
            let price = await russianRouletteInstance.costToBuyTickets(
                1,
                4,
            );
            // Generating chosen numbers for buy
            let ticketNumbers = [0, 1, 0, 5];
            // Approving russian roulette to spend cost
            await cybarInstance.connect(owner).approve(
                russianRouletteInstance.address,
                price
            );
            // Batch buying tokens
            await expect(
                russianRouletteInstance.connect(owner).batchBuyRussianRouletteTicket(
                    1,
                    4,
                    ticketNumbers
                )
            ).to.be.revertedWith(russianRoulette.errors.invalid_ticket_number_range);
        });
        it("Invalid ticket number above 6", async function () {
            // Getting the price to buy
            let price = await russianRouletteInstance.costToBuyTickets(
                1,
                6,
            );
            // Generating chosen numbers for buy
            let ticketNumbers = [7, 8, 10, 20, 50, 1];
            // Approving russian roulette to spend cost
            await cybarInstance.connect(owner).approve(
                russianRouletteInstance.address,
                price
            );
            // Batch buying tokens
            await expect(
                russianRouletteInstance.connect(owner).batchBuyRussianRouletteTicket(
                    1,
                    6,
                    ticketNumbers
                )
            ).to.be.revertedWith(russianRoulette.errors.invalid_ticket_number_range);
        });
        it("Batch buying 6 tickets with different ticket numbers", async function () {
            // Getting the price to buy
            let price = await russianRouletteInstance.costToBuyTickets(
                1,
                6
            );
            // Generating chosen numbers for buy
            let ticketNumbers = [1, 2, 3, 4, 5, 6];
            // Approving russian roulette to spend cost
            await cybarInstance.connect(owner).approve(
                russianRouletteInstance.address,
                price
            );
            // Batch buying tokens
            await russianRouletteInstance.connect(owner).batchBuyRussianRouletteTicket(
                1,
                6,
                ticketNumbers
            );
        });
        it("Batch buying 10 tickets", async function () {
            // Getting the price to buy
            let price = await russianRouletteInstance.costToBuyTickets(
                1,
                10
            );
            let ticketNumbers = [1, 2, 3, 4, 5, 6, 1, 2, 3, 4,];
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
        it("Batch buying 50 tickets", async function () {
            // Getting the price to buy
            let price = await russianRouletteInstance.costToBuyTickets(
                1,
                50
            );
            // Generating chosen numbers for buy
            let ticketNumbers = generateRussianRouletteNumbers({
                numberOfTickets: 50,
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
                50,
                ticketNumbers
            );
            // Testing results
            // TODO get user balances
            assert.equal(
                price.toString(),
                russianRoulette.buy.fifty.cost,
                "Incorrect cost for batch buy of 50"
            );
        });
        it("Batch buying more tickets than numbers", async function () {
            // Getting the price to buy
            let price = await russianRouletteInstance.costToBuyTickets(
                1,
                10
            );
            // Generating chosen numbers for buy
            let ticketNumbers = generateRussianRouletteNumbers({
                numberOfTickets: 8,
                maxRange: russianRoulette.setup.maxValidRange
            });
            // Approving russian roulette to spend cost
            await cybarInstance.connect(owner).approve(
                russianRouletteInstance.address,
                price
            );
            // Batch buying tokens
            await expect(
                russianRouletteInstance.connect(owner).batchBuyRussianRouletteTicket(
                    1,
                    10,
                    ticketNumbers
                )
            ).to.be.revertedWith(russianRoulette.errors.invalid_mint_numbers);
        });
        it("Invalid cybar transfer without approval", async function () {
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
            // Batch buying tokens
            await expect(
                russianRouletteInstance.connect(owner).batchBuyRussianRouletteTicket(
                    1,
                    10,
                    ticketNumbers
                )
            ).to.be.revertedWith(russianRoulette.errors.invalid_mint_approve);
        });
        it("Invalid buying time in future", async function () {
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
            // Approving russianRoulette to spend cost
            await cybarInstance.connect(owner).approve(
                russianRouletteInstance.address,
                price
            );
            // Getting the current block timestamp
            let currentTime = await russianRouletteInstance.getCurrentTime();
            // Converting to a BigNumber for manipulation 
            let timeStamp = new BigNumber(currentTime.toString());
            // Getting the timestamp for invalid time for buying
            let futureTime = timeStamp.plus(russianRoulette.newRussianRoulette.closeIncrease);
            // Setting the time forward 
            await russianRouletteInstance.setCurrentTime(futureTime.toString());
            // Batch buying tokens
            await expect(
                russianRouletteInstance.connect(owner).batchBuyRussianRouletteTicket(
                    1,
                    10,
                    ticketNumbers
                )
            ).to.be.revertedWith(russianRoulette.errors.invalid_mint_timestamp);
        });
    });
    describe("Drawing numbers tests", function () {
        beforeEach(async () => {
            // Getting the current block timestamp
            let currentTime = await russianRouletteInstance.getCurrentTime();
            // Converting to a BigNumber for manipulation 
            let timeStamp = new BigNumber(currentTime.toString());
            // Creating a new roulette
            await russianRouletteInstance.connect(owner).createNewRussianRoulette(
                russianRoulette.newRussianRoulette.prize,
                russianRoulette.newRussianRoulette.cost,
                timeStamp.toString(),
                timeStamp.plus(russianRoulette.newRussianRoulette.closeIncrease).toString()
            );
        });
        it("Setting winning number", async function () {
            let russianRouletteInfoBefore = await russianRouletteInstance.getBasicRussianRouletteInfo(1);
            // Setting the time so that we can set winning numbers
            // Getting the current block timestamp
            let currentTime = await russianRouletteInstance.getCurrentTime();
            // Converting to a BigNumber for manipulation 
            let timeStamp = new BigNumber(currentTime.toString());
            // Getting the timestamp for invalid time for buying
            let futureTime = timeStamp.plus(russianRoulette.newRussianRoulette.closeIncrease);
            // Setting the time forward 
            await russianRouletteInstance.setCurrentTime(futureTime.toString());
            // Drawing the numbers
            await russianRouletteInstance.connect(owner).drawWinningNumber(
                1,
                1234
            );
            // Getting info after call
            let russianRouletteInfoAfter = await russianRouletteInstance.getBasicRussianRouletteInfo(1);

            // Testing
            assert.equal(
                russianRouletteInfoBefore.winningNumber.toString(),
                russianRoulette.newRussianRoulette.win.blankWinningNumber,
                "Winning numbers set before call"
            );
            assert.equal(
                russianRouletteInfoAfter.winningNumber.toString(),
                russianRoulette.newRussianRoulette.win.afterWinningNumber,
                "Winning numbers incorrect after"
            );
        });
        /**
         * Testing that a non owner cannot set the winning numbers
         */
        it("Invalid winning numbers (owner)", async function () {
            // Getting the current block timestamp
            let currentTime = await russianRouletteInstance.getCurrentTime();
            // Converting to a BigNumber for manipulation 
            let timeStamp = new BigNumber(currentTime.toString());
            // Getting the timestamp for invalid time for buying
            let futureTime = timeStamp.plus(russianRoulette.newRussianRoulette.closeIncrease);
            // Setting the time forward 
            await russianRouletteInstance.setCurrentTime(futureTime.toString());
            // Drawing the numbers
            await expect(
                russianRouletteInstance.connect(buyer).drawWinningNumber(
                    1,
                    1234
                )
            ).to.be.revertedWith(russianRoulette.errors.invalid_admin);
        });
        /**
         * Testing that numbers cannot be updated once chosen
         */
        it("Invalid winning numbers (already chosen)", async function () {
            // Setting the time so that we can set winning numbers
            // Getting the current block timestamp
            let currentTime = await russianRouletteInstance.getCurrentTime();
            // Converting to a BigNumber for manipulation 
            let timeStamp = new BigNumber(currentTime.toString());
            // Getting the timestamp for invalid time for buying
            let futureTime = timeStamp.plus(russianRoulette.newRussianRoulette.closeIncrease);
            // Setting the time forward 
            await russianRouletteInstance.setCurrentTime(futureTime.toString());
            // Drawing the numbers
            await russianRouletteInstance.connect(owner).drawWinningNumber(
                1,
                1234
            );
            // Drawing the numbers again
            await expect(
                russianRouletteInstance.connect(owner).drawWinningNumber(
                    1,
                    1234
                )
            ).to.be.revertedWith(russianRoulette.errors.invalid_draw_repeat);
        });
        /**
         * Testing that winning numbers cannot be set while roulette still in 
         * progress
         */
        it("Invalid winning numbers (time)", async function () {
            await expect(
                russianRouletteInstance.connect(owner).drawWinningNumber(
                    1,
                    1234
                )
            ).to.be.revertedWith(russianRoulette.errors.invalid_draw_time);
        });
    });
    describe("Claiming tickets tests", function () {
        beforeEach(async () => {
            // Getting the current block timestamp
            let currentTime = await russianRouletteInstance.getCurrentTime();
            // Converting to a BigNumber for manipulation 
            let timeStamp = new BigNumber(currentTime.toString());
            // Creating a new roulette
            await russianRouletteInstance.connect(owner).createNewRussianRoulette(
                russianRoulette.newRussianRoulette.prize,
                russianRoulette.newRussianRoulette.cost,
                timeStamp.toString(),
                timeStamp.plus(russianRoulette.newRussianRoulette.closeIncrease).toString()
            );
            // Buying tickets
            // Getting the price to buy
            let price = await russianRouletteInstance.costToBuyTickets(
                1,
                7
            );
            // Sending the buyer the needed amount of cybar
            await cybarInstance.connect(buyer).mint(
                buyer.address,
                price
            );
            // Approving roulette to spend cost
            await cybarInstance.connect(buyer).approve(
                russianRouletteInstance.address,
                price
            );
            let ticketNumbers = [1, 2, 3, 4, 5, 6, 5];
            // Batch buying tokens
            await russianRouletteInstance.connect(buyer).batchBuyRussianRouletteTicket(
                1,
                7,
                ticketNumbers
            );
        });
        /**
         * Testing that claiming winning number changes the users balance
         * correctly. 
         */
        it("Claiming winning number", async function () {
            // Getting the price to buy
            let price = await russianRouletteInstance.costToBuyTickets(
                1,
                1
            );

            // Sending the buyer the needed amount of cybar
            await cybarInstance.connect(owner).transfer(
                buyer.address,
                price
            );
            // Approving roulette to spend cost
            await cybarInstance.connect(buyer).approve(
                russianRouletteInstance.address,
                price
            );

            await russianRouletteInstance.connect(buyer).batchBuyRussianRouletteTicket(
                1,
                1,
                russianRoulette.newRussianRoulette.win.winningNumber
            );
            // Setting current time so that drawing is correct
            // Getting the current block timestamp
            let currentTime = await russianRouletteInstance.getCurrentTime();
            // Converting to a BigNumber for manipulation 
            let timeStamp = new BigNumber(currentTime.toString());
            // Getting the timestamp for invalid time for buying
            let futureTime = timeStamp.plus(russianRoulette.newRussianRoulette.closeIncrease);
            // Setting the time forward
            await russianRouletteInstance.setCurrentTime(futureTime.toString());
            // Getting all users bought tickets
            let userTicketIds = await russianRouletteNftInstance.getUserTickets(1, buyer.address);
            // Drawing the numbers
            await russianRouletteInstance.connect(owner).drawWinningNumber(
                1,
                1234
            );
            let buyerCybarBalanceBefore = await cybarInstance.balanceOf(buyer.address);

            // Getting the current block timestamp
            currentTime = await russianRouletteInstance.getCurrentTime();
            // Converting to a BigNumber for manipulation 
            timeStamp = new BigNumber(currentTime.toString());
            let futureEndTime = timeStamp.plus(russianRoulette.newRussianRoulette.closeIncrease);
            // Setting the time forward 
            await russianRouletteInstance.setCurrentTime(futureEndTime.toString());
            // Claiming winnings 
            await russianRouletteInstance.connect(buyer).claimReward(
                1,
                userTicketIds[7].toString()
            );
            let buyerCybarBalanceAfter = await cybarInstance.balanceOf(buyer.address);
            // Tests
            // zero balance before claim on winnning ticket
            assert.equal(
                buyerCybarBalanceBefore.toString(),
                0,
                "Buyer has cybar balance before claiming"
            );
            // get half prize pool due to other correct ticket number
            assert.equal(
                buyerCybarBalanceAfter.toString(),
                russianRoulette.newRussianRoulette.win.winPrize.toString(),
                "User won incorrect amount"
            );
        });
        it("Claiming losing number", async function () {
            // Getting the price to buy
            let price = await russianRouletteInstance.costToBuyTickets(
                1,
                1
            );
            // Sending the buyer the needed amount of cybar
            await cybarInstance.connect(owner).transfer(
                buyer.address,
                price
            );
            // Approving roulette to spend cost
            await cybarInstance.connect(buyer).approve(
                russianRouletteInstance.address,
                price
            );

            await russianRouletteInstance.connect(buyer).batchBuyRussianRouletteTicket(
                1,
                1,
                russianRoulette.newRussianRoulette.win.loosingNumber
            );
            // Setting current time so that drawing is correct
            // Getting the current block timestamp
            let currentTime = await russianRouletteInstance.getCurrentTime();
            // Converting to a BigNumber for manipulation 
            let timeStamp = new BigNumber(currentTime.toString());
            // Getting the timestamp for invalid time for buying
            let futureTime = timeStamp.plus(russianRoulette.newRussianRoulette.closeIncrease);
            // Setting the time forward
            await russianRouletteInstance.setCurrentTime(futureTime.toString());
            // Getting all users bought tickets
            let userTicketIds = await russianRouletteNftInstance.getUserTickets(1, buyer.address);
            // Drawing the numbers
            await russianRouletteInstance.connect(owner).drawWinningNumber(
                1,
                1234
            );
            let buyerCybarBalanceBefore = await cybarInstance.balanceOf(buyer.address);

            // Getting the current block timestamp
            currentTime = await russianRouletteInstance.getCurrentTime();
            // Converting to a BigNumber for manipulation 
            timeStamp = new BigNumber(currentTime.toString());
            let futureEndTime = timeStamp.plus(russianRoulette.newRussianRoulette.closeIncrease);
            // Setting the time forward 
            await russianRouletteInstance.setCurrentTime(futureEndTime.toString());
            // Claiming winnings 
            await russianRouletteInstance.connect(buyer).claimReward(
                1,
                userTicketIds[7].toString()
            );
            let buyerCybarBalanceAfter = await cybarInstance.balanceOf(buyer.address);
            // Tests
            assert.equal(
                buyerCybarBalanceBefore.toString(),
                0,
                "Buyer has cybar balance before claiming"
            );
            assert.equal(
                buyerCybarBalanceAfter.toString(),
                0,
                "User won incorrect amount"
            );
        });
        /**
         * Testing that a claim cannot happen while the roulette is still active
         */
        it("Invalid claim (incorrect time)", async function () {
            // Setting current time so that drawing is correct
            // Getting the current block timestamp
            let currentTime = await russianRouletteInstance.getCurrentTime();
            // Converting to a BigNumber for manipulation 
            let timeStamp = new BigNumber(currentTime.toString());
            // Getting the timestamp for invalid time for buying
            let futureTime = timeStamp.plus(russianRoulette.newRussianRoulette.closeIncrease);
            // Setting the time forward 
            await russianRouletteInstance.setCurrentTime(futureTime.toString());
            // Getting all users bought tickets
            let userTicketIds = await russianRouletteNftInstance.getUserTickets(1, buyer.address);
            // Drawing the numbers
            await russianRouletteInstance.connect(owner).drawWinningNumber(
                1,
                1234
            );
            await russianRouletteInstance.setCurrentTime(currentTime.toString());
            // Claiming winnings 
            await expect(
                russianRouletteInstance.connect(buyer).claimReward(
                    1,
                    userTicketIds[1].toString()
                )
            ).to.be.revertedWith(russianRoulette.errors.invalid_claim_time);
        });
        /**
         * Testing that a claim cannot happen until the winning numbers are
         * chosen. 
         */
        it("Invalid claim (winning number not chosen)", async function () {
            // Getting all users bought tickets
            let userTicketIds = await russianRouletteNftInstance.getUserTickets(1, buyer.address);
            // Getting the current block timestamp
            let currentTime = await russianRouletteInstance.getCurrentTime();
            // Converting to a BigNumber for manipulation 
            let timeStamp = new BigNumber(currentTime.toString());
            let futureEndTime = timeStamp.plus(russianRoulette.newRussianRoulette.closeIncrease);
            // Setting the time forward 
            await russianRouletteInstance.setCurrentTime(futureEndTime.toString());
            // Claiming winnings 
            await expect(
                russianRouletteInstance.connect(buyer).claimReward(
                    1,
                    userTicketIds[2].toString()
                )
            ).to.be.revertedWith(russianRoulette.errors.invalid_claim_draw);
        });
        /**
         * Testing that only the owner of a token can claim winnings
         */
        it("Invalid claim (not owner)", async function () {
            // Setting current time so that drawing is correct
            // Getting the current block timestamp
            let currentTime = await russianRouletteInstance.getCurrentTime();
            // Converting to a BigNumber for manipulation 
            let timeStamp = new BigNumber(currentTime.toString());
            // Getting the timestamp for invalid time for buying
            let futureTime = timeStamp.plus(russianRoulette.newRussianRoulette.closeIncrease);
            // Setting the time forward 
            await russianRouletteInstance.setCurrentTime(futureTime.toString());
            // Getting all users bought tickets
            let userTicketIds = await russianRouletteNftInstance.getUserTickets(1, buyer.address);
            // Drawing the numbers
            await russianRouletteInstance.connect(owner).drawWinningNumber(
                1,
                1234
            );
            // Getting the current block timestamp
            currentTime = await russianRouletteInstance.getCurrentTime();
            // Converting to a BigNumber for manipulation 
            timeStamp = new BigNumber(currentTime.toString());
            let futureEndTime = timeStamp.plus(russianRoulette.newRussianRoulette.closeIncrease);
            // Setting the time forward 
            await russianRouletteInstance.setCurrentTime(futureEndTime.toString());
            // Claiming winnings 
            await expect(
                russianRouletteInstance.connect(owner).claimReward(
                    1,
                    userTicketIds[2].toString()
                )
            ).to.be.revertedWith(russianRoulette.errors.invalid_claim_owner);
        });
        /**
         * Testing that a ticket cannot be claimed twice
         */
        it("Invalid claim (already claimed)", async function () {
            // Setting current time so that drawing is correct
            // Getting the current block timestamp
            let currentTime = await russianRouletteInstance.getCurrentTime();
            // Converting to a BigNumber for manipulation 
            let timeStamp = new BigNumber(currentTime.toString());
            // Getting the timestamp for invalid time for buying
            let futureTime = timeStamp.plus(russianRoulette.newRussianRoulette.closeIncrease);
            // Setting the time forward 
            await russianRouletteInstance.setCurrentTime(futureTime.toString());
            // Getting all users bought tickets
            let userTicketIds = await russianRouletteNftInstance.getUserTickets(1, buyer.address);
            // Drawing the numbers
            await russianRouletteInstance.connect(owner).drawWinningNumber(
                1,
                1234
            );
            // Getting the current block timestamp
            currentTime = await russianRouletteInstance.getCurrentTime();
            // Converting to a BigNumber for manipulation 
            timeStamp = new BigNumber(currentTime.toString());
            let futureEndTime = timeStamp.plus(russianRoulette.newRussianRoulette.closeIncrease);
            // Setting the time forward 
            await russianRouletteInstance.setCurrentTime(futureEndTime.toString());
            // Claiming winnings 
            await russianRouletteInstance.connect(buyer).claimReward(
                1,
                userTicketIds[2].toString()
            );
            // Claiming winnings again
            await expect(
                russianRouletteInstance.connect(buyer).claimReward(
                    1,
                    userTicketIds[2].toString()
                )
            ).to.be.revertedWith(russianRoulette.errors.invalid_claim_duplicate);
        });
        it("Invalid claim (ticket for different roulette)", async function () {
            // Getting the current block timestamp
            let currentTime = await russianRouletteInstance.getCurrentTime();
            // Converting to a BigNumber for manipulation 
            let timeStamp = new BigNumber(currentTime.toString());
            // Creating a new instance of the roulette
            await russianRouletteInstance.connect(owner).createNewRussianRoulette(
                russianRoulette.newRussianRoulette.prize,
                russianRoulette.newRussianRoulette.cost,
                timeStamp.toString(),
                timeStamp.plus(russianRoulette.newRussianRoulette.closeIncrease).toString()
            );
            // Getting the price to buy
            let price = await russianRouletteInstance.costToBuyTickets(
                2,
                1
            );
            // Sending the buyer the needed amount of cybar
            await cybarInstance.connect(owner).transfer(
                buyer.address,
                price
            );
            // Approving roulette to spend cost
            await cybarInstance.connect(buyer).approve(
                russianRouletteInstance.address,
                price
            );
            await russianRouletteInstance.connect(buyer).batchBuyRussianRouletteTicket(
                2,
                1,
                russianRoulette.newRussianRoulette.win.winningNumber
            );
            // Setting current time so that drawing is correct
            // Getting the current block timestamp
            currentTime = await russianRouletteInstance.getCurrentTime();
            // Converting to a BigNumber for manipulation 
            timeStamp = new BigNumber(currentTime.toString());
            // Getting the timestamp for invalid time for buying
            let futureTime = timeStamp.plus(russianRoulette.newRussianRoulette.closeIncrease);
            // Setting the time forward 
            await russianRouletteInstance.setCurrentTime(futureTime.toString());
            // Getting all users bought tickets
            let userTicketIds = await russianRouletteNftInstance.getUserTickets(2, buyer.address);
            // Drawing the numbers
            await russianRouletteInstance.connect(owner).drawWinningNumber(
                1,
                1234
            );
            // Getting the current block timestamp
            currentTime = await russianRouletteInstance.getCurrentTime();
            // Converting to a BigNumber for manipulation 
            timeStamp = new BigNumber(currentTime.toString());
            let futureEndTime = timeStamp.plus(russianRoulette.newRussianRoulette.closeIncrease);
            // Setting the time forward 
            await russianRouletteInstance.setCurrentTime(futureEndTime.toString());
            // Claiming winnings with invalid numbers
            await expect(
                russianRouletteInstance.connect(buyer).claimReward(
                    1,
                    userTicketIds[0].toString()
                )
            ).to.be.revertedWith(russianRoulette.errors.invalid_claim_russian_roulette);
        });
    });
    describe("Batch claiming tickets tests", function () {
        beforeEach(async () => {
            // Getting the current block timestamp
            let currentTime = await russianRouletteInstance.getCurrentTime();
            // Converting to a BigNumber for manipulation 
            let timeStamp = new BigNumber(currentTime.toString());
            // Creating a new roulette
            await russianRouletteInstance.connect(owner).createNewRussianRoulette(
                russianRoulette.newRussianRoulette.prize,
                russianRoulette.newRussianRoulette.cost,
                timeStamp.toString(),
                timeStamp.plus(russianRoulette.newRussianRoulette.closeIncrease).toString()
            );
            // Buying tickets
            // Getting the price to buy
            let price = await russianRouletteInstance.costToBuyTickets(
                1,
                7
            );
            // Sending the buyer the needed amount of cybar
            await cybarInstance.connect(buyer).mint(
                buyer.address,
                price
            );
            // Approving roulette to spend cost
            await cybarInstance.connect(buyer).approve(
                russianRouletteInstance.address,
                price
            );
            let ticketNumbers = [1, 2, 3, 4, 5, 6, 5];
            // Batch buying tokens
            await russianRouletteInstance.connect(buyer).batchBuyRussianRouletteTicket(
                1,
                7,
                ticketNumbers
            );
            // Getting the price to buy
            price = await russianRouletteInstance.costToBuyTickets(
                1,
                1
            );
            // Sending the buyer the needed amount of cybar
            await cybarInstance.connect(owner).transfer(
                buyer.address,
                price
            );
            // Approving roulette to spend cost
            await cybarInstance.connect(buyer).approve(
                russianRouletteInstance.address,
                price
            );
            await russianRouletteInstance.connect(buyer).batchBuyRussianRouletteTicket(
                1,
                1,
                russianRoulette.newRussianRoulette.win.winningNumber
            );
            // Setting current time so that drawing is correct
            // Getting the current block timestamp
            currentTime = await russianRouletteInstance.getCurrentTime();
            // Converting to a BigNumber for manipulation 
            timeStamp = new BigNumber(currentTime.toString());
            // Getting the timestamp for invalid time for buying
            let futureTime = timeStamp.plus(russianRoulette.newRussianRoulette.closeIncrease);
            // Setting the time forward 
            await russianRouletteInstance.setCurrentTime(futureTime.toString());
        });
        it("Batch claiming winning numbers", async function () {
            // Getting all users bought tickets
            let userTicketIds = await russianRouletteNftInstance.getUserTickets(1, buyer.address);
            // Drawing the numbers
            await russianRouletteInstance.connect(owner).drawWinningNumber(
                1,
                1234
            );
            let buyerCybarBalanceBefore = await cybarInstance.balanceOf(buyer.address);
            // Getting the current block timestamp
            let currentTime = await russianRouletteInstance.getCurrentTime();
            // Converting to a BigNumber for manipulation 
            let timeStamp = new BigNumber(currentTime.toString());
            let futureEndTime = timeStamp.plus(russianRoulette.newRussianRoulette.closeIncrease);
            // Setting the time forward 
            await russianRouletteInstance.setCurrentTime(futureEndTime.toString());
            // Claiming winnings 
            await russianRouletteInstance.connect(buyer).batchClaimRewards(
                1,
                userTicketIds
            );
            let buyerCybarBalanceAfter = await cybarInstance.balanceOf(buyer.address);
            // Tests
            assert.equal(
                buyerCybarBalanceBefore.toString(),
                0,
                "Buyer has cybar balance before claiming"
            );
            assert.notEqual(
                buyerCybarBalanceBefore.toString(),
                buyerCybarBalanceAfter.toString(),
                "User balance has not changed"
            );
            assert.notEqual(
                buyerCybarBalanceAfter.toString(),
                russianRoulette.newRussianRoulette.win.winningNumber.toString(),
                "User won incorrect amount"
            );
        });
    });
    describe("Upgrade functionality tests", function () {
        /**
         * Tests that an admin can update the size of a roulette
         */
        it("Update range of numbers", async function () {
            // Getting the range
            let maxRange = await russianRouletteInstance.maxValidRange_();
            // Updating range
            await russianRouletteInstance.connect(owner).updateMaxRange(
                russianRoulette.update.maxValidRange
            );
            // Getting the range after
            let maxRangeAfter = await russianRouletteInstance.maxValidRange_();
            // Testing
            assert.equal(
                maxRange.toString(),
                russianRoulette.setup.maxValidRange,
                "Max range incorrect before update"
            );
            assert.equal(
                maxRangeAfter.toString(),
                russianRoulette.update.maxValidRange,
                "Max range incorrect after update"
            );
        });
        it("Invalid update size of roulette (same as current)", async function () {
            // Updating range
            await expect(
                russianRouletteInstance.connect(owner).updateMaxRange(
                    russianRoulette.setup.maxValidRange
                )
            ).to.be.revertedWith(russianRoulette.errors.invalid_size_update_duplicate);
        });
        it("Invalid update size of roulette (non-owner)", async function () {
            // Updating the size of the roulette
            await expect(
                russianRouletteInstance.connect(buyer).updateMaxRange(
                    russianRoulette.setup.maxValidRange
                )
            ).to.be.revertedWith(russianRoulette.errors.invalid_admin);
        });
        it("Withdraw excess cybar", async function () {
            let ownerCybarBalance = await cybarInstance.balanceOf(owner.address);
            let russianRouletteCybarBalance = await cybarInstance.balanceOf(russianRouletteInstance.address);
            await russianRouletteInstance.connect(owner).withdrawCybar(russianRouletteCybarBalance);
            let ownerCybarBalanceAfter = await cybarInstance.balanceOf(owner.address);
            let russianRouletteCybarBalanceAfter = await cybarInstance.balanceOf(russianRouletteInstance.address);
            // Tests
            assert.notEqual(
                ownerCybarBalance.toString(),
                ownerCybarBalanceAfter.toString(),
                "Owner cybar balance did not change"
            );
            assert.notEqual(
                russianRouletteCybarBalance.toString(),
                russianRouletteCybarBalanceAfter.toString(),
                "Lottery balance did not change"
            );
            assert.equal(
                russianRouletteCybarBalanceAfter.toString(),
                0,
                "Lottery has not been drained"
            );
        });
        it("Invalid withdraw excess cybar (non owner)", async function () {
            let russianRouletteCybarBalance = await cybarInstance.balanceOf(russianRouletteInstance.address);
            await expect(
                russianRouletteInstance.connect(buyer).withdrawCybar(russianRouletteCybarBalance)
            ).to.be.revertedWith(russianRoulette.errors.invalid_admin);
        });
    });
});
