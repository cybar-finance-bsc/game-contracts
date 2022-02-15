const { expect, assert } = require("chai");
const { network } = require("hardhat");
const {
    lotto,
    lottoNFT,
    BigNumber,
    generateLottoNumbers,
    generateFixedLottoNumbers
} = require("./settings/lottoSettings");

describe("Lottery contract", function () {
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

    // Creating the users
    let owner, buyer;

    beforeEach(async () => {
        // Getting the signers provided by ethers
        const signers = await ethers.getSigners();
        // Creating the active wallets for use
        owner = signers[0];
        buyer = signers[1];

        // Getting the lottery code (abi, bytecode, name)
        lotteryContract = await ethers.getContractFactory("Lottery");
        // Getting the lotteryNFT code (abi, bytecode, name)
        lotteryNftContract = await ethers.getContractFactory("LotteryNFT");
        // Getting the lotteryNFT code (abi, bytecode, name)
        mock_erc20Contract = await ethers.getContractFactory("Mock_erc20");
        // Getting the timer code (abi, bytecode, name)
        timerContract = await ethers.getContractFactory("Timer");
        // // Getting the ChainLink contracts code (abi, bytecode, name)
        // randGenContract = await ethers.getContractFactory("RandomNumberGenerator");
        // Getting the ChainLink contracts code (abi, bytecode, name)
        randGenContract = await ethers.getContractFactory("RNG_Mock");


        // Deploying the instances
        timerInstance = await timerContract.deploy();
        cybarInstance = await mock_erc20Contract.deploy(
            lotto.buy.cybar,
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
            lotto.chainLink.dataFeedAddress,
            lotteryInstance.address
        );
        lotteryNftInstance = await lotteryNftContract.deploy(
            lottoNFT.newLottoNft.uri,
            lotteryInstance.address,
            timerInstance.address
        );
        await lotteryInstance.initialize(
            lotteryNftInstance.address,
            randGenInstance.address
        );
        // Making sure the lottery has some cybar
        await cybarInstance.mint(
            lotteryInstance.address,
            lotto.newLotto.prize
        );
    });

    describe("Creating a new lottery tests", function () {
        /**
         * Tests that in the nominal case nothing goes wrong
         */
        it("Nominal case", async function () {
            // Getting the current block timestamp
            let currentTime = await lotteryInstance.getCurrentTime();
            // Converting to a BigNumber for manipulation 
            let timeStamp = new BigNumber(currentTime.toString());
            // Creating a new lottery
            await expect(
                lotteryInstance.connect(owner).createNewLotto(
                    lotto.newLotto.distribution,
                    lotto.newLotto.prize,
                    lotto.newLotto.cost,
                    timeStamp.toString(),
                    timeStamp.plus(lotto.newLotto.closeIncrease).toString()
                )
            ).to.emit(lotteryInstance, lotto.events.new)
                // Checking that emitted event contains correct information
                .withArgs(
                    1,
                    0
                );
        });
        /**
         * Testing that non-admins cannot create a lotto
         */
        it("Invalid admin", async function () {
            // Getting the current block timestamp
            let currentTime = await lotteryInstance.getCurrentTime();
            // Converting to a BigNumber for manipulation 
            let timeStamp = new BigNumber(currentTime.toString());
            // Checking call reverts with correct error message
            await expect(
                lotteryInstance.connect(buyer).createNewLotto(
                    lotto.newLotto.distribution,
                    lotto.newLotto.prize,
                    lotto.newLotto.cost,
                    timeStamp.toString(),
                    timeStamp.plus(lotto.newLotto.closeIncrease).toString()
                )
            ).to.be.revertedWith(lotto.errors.invalid_admin);
        });
        /**
         * Testing that an invalid distribution will fail
         */
        it("Invalid price distribution length", async function () {
            // Getting the current block timestamp
            let currentTime = await lotteryInstance.getCurrentTime();
            // Converting to a BigNumber for manipulation 
            let timeStamp = new BigNumber(currentTime.toString());
            // Checking call reverts with correct error message
            await expect(
                lotteryInstance.connect(owner).createNewLotto(
                    lotto.errorData.distribution_length,
                    lotto.newLotto.prize,
                    lotto.newLotto.cost,
                    timeStamp.toString(),
                    timeStamp.plus(lotto.newLotto.closeIncrease).toString()
                )
            ).to.be.revertedWith(lotto.errors.invalid_distribution_length);
        });
        /**
         * Testing that an invalid distribution will fail
         */
        it("Invalid price distribution total", async function () {
            // Getting the current block timestamp
            let currentTime = await lotteryInstance.getCurrentTime();
            // Converting to a BigNumber for manipulation 
            let timeStamp = new BigNumber(currentTime.toString());
            // Checking call reverts with correct error message
            await expect(
                lotteryInstance.connect(owner).createNewLotto(
                    lotto.errorData.distribution_total,
                    lotto.newLotto.prize,
                    lotto.newLotto.cost,
                    timeStamp.toString(),
                    timeStamp.plus(lotto.newLotto.closeIncrease).toString()
                )
            ).to.be.revertedWith(lotto.errors.invalid_distribution_total);
        });
        /**
         * Testing that an invalid prize and cost will fail
         */
        it("Invalid price distribution", async function () {
            // Getting the current block timestamp
            let currentTime = await lotteryInstance.getCurrentTime();
            // Converting to a BigNumber for manipulation 
            let timeStamp = new BigNumber(currentTime.toString());
            // Checking call reverts with correct error message
            await expect(
                lotteryInstance.connect(owner).createNewLotto(
                    lotto.newLotto.distribution,
                    lotto.errorData.prize,
                    lotto.newLotto.cost,
                    timeStamp.toString(),
                    timeStamp.plus(lotto.newLotto.closeIncrease).toString()
                )
            ).to.be.revertedWith(lotto.errors.invalid_price_or_cost);
            // Checking call reverts with correct error message
            await expect(
                lotteryInstance.connect(owner).createNewLotto(
                    lotto.newLotto.distribution,
                    lotto.newLotto.prize,
                    lotto.errorData.cost,
                    timeStamp.toString(),
                    timeStamp.plus(lotto.newLotto.closeIncrease).toString()
                )
            ).to.be.revertedWith(lotto.errors.invalid_price_or_cost);
        });
        /**
         * Testing that an invalid prize and cost will fail
         */
        it("Invalid timestamps", async function () {
            // Getting the current block timestamp
            let currentTime = await lotteryInstance.getCurrentTime();
            // Converting to a BigNumber for manipulation 
            let timeStamp = new BigNumber(currentTime.toString());
            // Checking call reverts with correct error message
            await expect(
                lotteryInstance.connect(owner).createNewLotto(
                    lotto.newLotto.distribution,
                    lotto.newLotto.prize,
                    lotto.newLotto.cost,
                    lotto.errorData.startTime,
                    timeStamp.plus(lotto.newLotto.closeIncrease).toString()
                )
            ).to.be.revertedWith(lotto.errors.invalid_timestamp);
            // Checking call reverts with correct error message
            await expect(
                lotteryInstance.connect(owner).createNewLotto(
                    lotto.newLotto.distribution,
                    lotto.newLotto.prize,
                    lotto.newLotto.cost,
                    timeStamp.toString(),
                    timeStamp.toString()
                )
            ).to.be.revertedWith(lotto.errors.invalid_timestamp);
        });
    });

    describe("Buying tickets tests", function () {
        /**
         * Creating a lotto for all buying tests to use. Will be a new instance
         * for each lotto. 
         */
        beforeEach(async () => {
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
        });
        /**
         * Tests cost per ticket is as expected
         */
        it("Cost per ticket", async function () {
            let totalPrice = await lotteryInstance.costToBuyTickets(
                1,
                10
            );
            // Works back from totalPrice to one token cost
            let check = BigNumber(totalPrice.toString());
            let noOfTickets = new BigNumber(10);
            let oneCost = check.div(noOfTickets);
            // Checks price is correct
            assert.equal(
                totalPrice.toString(),
                lotto.buy.ten.cost,
                "Incorrect cost for batch buy of 10"
            );
            assert.equal(
                oneCost.toString(),
                lotto.newLotto.cost.toString(),
                "Incorrect cost for batch buy of 10"
            );
        });
        /**
         * Tests the batch buying of one token
         */
        it("Batch buying 1 tickets", async function () {
            // Getting the price to buy
            let price = await lotteryInstance.costToBuyTickets(
                1,
                1
            );
            // Generating chosen numbers for buy
            let ticketNumbers = generateLottoNumbers({
                numberOfTickets: 1,
                lottoSize: lotto.setup.sizeOfLottery,
                maxRange: lotto.setup.maxValidRange
            });
            // Approving lotto to spend cost
            await cybarInstance.connect(owner).approve(
                lotteryInstance.address,
                price
            );
            // Batch buying tokens
            await lotteryInstance.batchBuyLottoTicket(
                1,
                1,
                ticketNumbers
            );
            // Testing results
            assert.equal(
                price.toString(),
                lotto.buy.one.cost,
                "Incorrect cost for batch buy of 1"
            );
        });
        /**
         * Tests the batch buying of ten token
         */
        it("Batch buying 10 tickets", async function () {
            // Getting the price to buy
            let price = await lotteryInstance.costToBuyTickets(
                1,
                10
            );
            // Generating chosen numbers for buy
            let ticketNumbers = generateLottoNumbers({
                numberOfTickets: 10,
                lottoSize: lotto.setup.sizeOfLottery,
                maxRange: lotto.setup.maxValidRange
            });
            // Approving lotto to spend cost
            await cybarInstance.connect(owner).approve(
                lotteryInstance.address,
                price
            );
            // Batch buying tokens
            await lotteryInstance.connect(owner).batchBuyLottoTicket(
                1,
                10,
                ticketNumbers
            );
            // Testing results
            // TODO get user balances
            assert.equal(
                price.toString(),
                lotto.buy.ten.cost,
                "Incorrect cost for batch buy of 10"
            );
        });
        /**
         * Tests the batch buying of fifty token
         */
        it("Batch buying 50 tickets", async function () {
            // Getting the price to buy
            let price = await lotteryInstance.costToBuyTickets(
                1,
                50
            );
            // Generating chosen numbers for buy
            let ticketNumbers = generateLottoNumbers({
                numberOfTickets: 50,
                lottoSize: lotto.setup.sizeOfLottery,
                maxRange: lotto.setup.maxValidRange
            });
            // Approving lotto to spend cost
            await cybarInstance.connect(owner).approve(
                lotteryInstance.address,
                price
            );
            // Batch buying tokens
            await lotteryInstance.connect(owner).batchBuyLottoTicket(
                1,
                50,
                ticketNumbers
            );
            // Testing results
            assert.equal(
                price.toString(),
                lotto.buy.fifty.cost,
                "Incorrect cost for batch buy of 50"
            );
        });
        /**
         * Tests the batch buying with invalid ticket numbers
         */
        it("Invalid chosen numbers", async function () {
            // Getting the price to buy
            let price = await lotteryInstance.costToBuyTickets(
                1,
                10
            );
            // Generating chosen numbers for buy
            let ticketNumbers = generateLottoNumbers({
                numberOfTickets: 9,
                lottoSize: lotto.setup.sizeOfLottery,
                maxRange: lotto.setup.maxValidRange
            });
            // Approving lotto to spend cost
            await cybarInstance.connect(owner).approve(
                lotteryInstance.address,
                price
            );
            // Batch buying tokens
            await expect(
                lotteryInstance.connect(owner).batchBuyLottoTicket(
                    1,
                    10,
                    ticketNumbers
                )
            ).to.be.revertedWith(lotto.errors.invalid_mint_numbers);
        });
        /**
         * Tests the batch buying with invalid approve
         */
        it("Invalid cybar transfer", async function () {
            // Getting the price to buy
            let price = await lotteryInstance.costToBuyTickets(
                1,
                10
            );
            // Generating chosen numbers for buy
            let ticketNumbers = generateLottoNumbers({
                numberOfTickets: 10,
                lottoSize: lotto.setup.sizeOfLottery,
                maxRange: lotto.setup.maxValidRange
            });
            // Batch buying tokens
            await expect(
                lotteryInstance.connect(owner).batchBuyLottoTicket(
                    1,
                    10,
                    ticketNumbers
                )
            ).to.be.revertedWith(lotto.errors.invalid_mint_approve);
        });
        /**
         * Tests the batch buying after the valid time period fails
         */
        it("Invalid buying time", async function () {
            // Getting the price to buy
            let price = await lotteryInstance.costToBuyTickets(
                1,
                10
            );
            // Generating chosen numbers for buy
            let ticketNumbers = generateLottoNumbers({
                numberOfTickets: 10,
                lottoSize: lotto.setup.sizeOfLottery,
                maxRange: lotto.setup.maxValidRange
            });
            // Approving lotto to spend cost
            await cybarInstance.connect(owner).approve(
                lotteryInstance.address,
                price
            );
            // Getting the current block timestamp
            let currentTime = await lotteryInstance.getCurrentTime();
            // Converting to a BigNumber for manipulation 
            let timeStamp = new BigNumber(currentTime.toString());
            // Getting the timestamp for invalid time for buying
            let futureTime = timeStamp.plus(lotto.newLotto.closeIncrease);
            // Setting the time forward 
            await lotteryInstance.setCurrentTime(futureTime.toString());
            // Batch buying tokens
            await expect(
                lotteryInstance.connect(owner).batchBuyLottoTicket(
                    1,
                    10,
                    ticketNumbers
                )
            ).to.be.revertedWith(lotto.errors.invalid_mint_timestamp);
        });
    });

    describe("Drawing numbers tests", function () {
        beforeEach(async () => {
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
        });
        /**
         * Testing that the winning numbers can be set in the nominal case
         */
        it("Setting winning numbers", async function () {
            let lotteryInfoBefore = await lotteryInstance.getBasicLottoInfo(1);
            // Setting the time so that we can set winning numbers
            // Getting the current block timestamp
            let currentTime = await lotteryInstance.getCurrentTime();
            // Converting to a BigNumber for manipulation 
            let timeStamp = new BigNumber(currentTime.toString());
            // Getting the timestamp for invalid time for buying
            let futureTime = timeStamp.plus(lotto.newLotto.closeIncrease);
            // Setting the time forward 
            await lotteryInstance.setCurrentTime(futureTime.toString());
            // Drawing the numbers
            let tx = await (await lotteryInstance.connect(owner).drawWinningNumbers(
                1,
                1234
            )).wait();
            // Getting info after call
            let lotteryInfoAfter = await lotteryInstance.getBasicLottoInfo(1);
            // Testing
            assert.equal(
                lotteryInfoBefore.winningNumbers.toString(),
                lotto.newLotto.win.blankWinningNumbers,
                "Winning numbers set before call"
            );
            assert.equal(
                lotteryInfoAfter.winningNumbers.toString(),
                lotto.newLotto.win.winningNumbers,
                "Winning numbers incorrect after"
            );
        });
        /**
         * Testing that a non owner cannot set the winning numbers
         */
        it("Invalid winning numbers (owner)", async function () {
            // Getting the current block timestamp
            let currentTime = await lotteryInstance.getCurrentTime();
            // Converting to a BigNumber for manipulation 
            let timeStamp = new BigNumber(currentTime.toString());
            // Getting the timestamp for invalid time for buying
            let futureTime = timeStamp.plus(lotto.newLotto.closeIncrease);
            // Setting the time forward 
            await lotteryInstance.setCurrentTime(futureTime.toString());
            // Drawing the numbers
            await expect(
                lotteryInstance.connect(buyer).drawWinningNumbers(
                    1,
                    1234
                )
            ).to.be.revertedWith(lotto.errors.invalid_admin);
        });
        // /**
        //  * Testing that numbers cannot be updated once chosen
        //  */
        // it("Invalid winning numbers (already chosen)", async function () {
        //     // Setting the time so that we can set winning numbers
        //     // Getting the current block timestamp
        //     let currentTime = await lotteryInstance.getCurrentTime();
        //     // Converting to a BigNumber for manipulation 
        //     let timeStamp = new BigNumber(currentTime.toString());
        //     // Getting the timestamp for invalid time for buying
        //     let futureTime = timeStamp.plus(lotto.newLotto.closeIncrease);
        //     // Setting the time forward 
        //     await lotteryInstance.setCurrentTime(futureTime.toString());
        //     // Drawing the numbers
        //     await lotteryInstance.connect(owner).drawWinningNumbers(
        //         1,
        //         1234
        //     );
        //     // Drawing the numbers again
        //     await expect(
        //         lotteryInstance.connect(owner).drawWinningNumbers(
        //             1,
        //             1234
        //         )
        //     ).to.be.revertedWith(lotto.errors.invalid_draw_repeat);
        // });
        /**
         * Testing that winning numbers cannot be set while lottery still in 
         * progress
         */
        it("Invalid winning numbers (time)", async function () {
            await expect(
                lotteryInstance.connect(owner).drawWinningNumbers(
                    1,
                    1234
                )
            ).to.be.revertedWith(lotto.errors.invalid_draw_time);
        });
    });
    describe("Claiming tickets tests", function () {
        beforeEach(async () => {
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
            // Buying tickets
            // Getting the price to buy
            let prices = await lotteryInstance.costToBuyTicketsWithDiscount(
                1,
                50
            );
            // Sending the buyer the needed amount of cybar
            await cybarInstance.connect(buyer).mint(
                buyer.address,
                prices[2]
            );
            // Approving lotto to spend cost
            await cybarInstance.connect(buyer).approve(
                lotteryInstance.address,
                prices[2]
            );
            // Generating chosen numbers for buy
            let ticketNumbers = generateFixedLottoNumbers({
                numberOfTickets: 50,
                lottoSize: lotto.setup.sizeOfLottery,
                maxRange: lotto.setup.maxValidRange
            });
            // Batch buying tokens
            await lotteryInstance.connect(buyer).batchBuyLottoTicket(
                1,
                50,
                ticketNumbers
            );
        });
        /**
         * Testing that claiming numbers (4 match) changes the users balance
         * correctly. 
         */
        it("Claiming winning numbers (4 (all) match)", async function () {
            // Getting the price to buy
            let prices = await lotteryInstance.costToBuyTicketsWithDiscount(
                1,
                1
            );
            // Sending the buyer the needed amount of cybar
            await cybarInstance.connect(owner).transfer(
                buyer.address,
                prices[2]
            );
            // Approving lotto to spend cost
            await cybarInstance.connect(buyer).approve(
                lotteryInstance.address,
                prices[2]
            );
            await lotteryInstance.connect(buyer).batchBuyLottoTicket(
                1,
                1,
                lotto.newLotto.win.winningNumbersArr
            );
            // Setting current time so that drawing is correct
            // Getting the current block timestamp
            let currentTime = await lotteryInstance.getCurrentTime();
            // Converting to a BigNumber for manipulation 
            let timeStamp = new BigNumber(currentTime.toString());
            // Getting the timestamp for invalid time for buying
            let futureTime = timeStamp.plus(lotto.newLotto.closeIncrease);
            // Setting the time forward 
            await lotteryInstance.setCurrentTime(futureTime.toString());
            // Getting all users bought tickets
            let userTicketIds = await lotteryNftInstance.getUserTickets(1, buyer.address);
            // Drawing the numbers
            await lotteryInstance.connect(owner).drawWinningNumbers(
                1,
                1234
            );
            let buyerCybarBalanceBefore = await cybarInstance.balanceOf(buyer.address);

            // Getting the current block timestamp
            currentTime = await lotteryInstance.getCurrentTime();
            // Converting to a BigNumber for manipulation 
            timeStamp = new BigNumber(currentTime.toString());
            let futureEndTime = timeStamp.plus(lotto.newLotto.closeIncrease);
            // Setting the time forward 
            await lotteryInstance.setCurrentTime(futureEndTime.toString());
            // Claiming winnings 
            await lotteryInstance.connect(buyer).claimReward(
                1,
                userTicketIds[50].toString()
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
                lotto.newLotto.win.match_all.toString(),
                "User won incorrect amount"
            );
        });
        /**
         * Testing that claiming numbers (3 match) changes the users balance
         * correctly. 
         */
        it("Claiming winning numbers (3 match)", async function () {
            // Getting the price to buy
            let prices = await lotteryInstance.costToBuyTicketsWithDiscount(
                1,
                1
            );
            // Sending the buyer the needed amount of cybar
            await cybarInstance.connect(owner).transfer(
                buyer.address,
                prices[2]
            );
            // Approving lotto to spend cost
            await cybarInstance.connect(buyer).approve(
                lotteryInstance.address,
                prices[2]
            );
            let altered = lotto.newLotto.win.winningNumbersArr;
            altered[0] = 0;
            await lotteryInstance.connect(buyer).batchBuyLottoTicket(
                1,
                1,
                altered
            );
            // Setting current time so that drawing is correct
            // Getting the current block timestamp
            let currentTime = await lotteryInstance.getCurrentTime();
            // Converting to a BigNumber for manipulation 
            let timeStamp = new BigNumber(currentTime.toString());
            // Getting the timestamp for invalid time for buying
            let futureTime = timeStamp.plus(lotto.newLotto.closeIncrease);
            // Setting the time forward 
            await lotteryInstance.setCurrentTime(futureTime.toString());
            // Getting all users bought tickets
            let userTicketIds = await lotteryNftInstance.getUserTickets(1, buyer.address);
            // Drawing the numbers
            await lotteryInstance.connect(owner).drawWinningNumbers(
                1,
                1234
            );
            let buyerCybarBalanceBefore = await cybarInstance.balanceOf(buyer.address);
            // Getting the current block timestamp
            currentTime = await lotteryInstance.getCurrentTime();
            // Converting to a BigNumber for manipulation 
            timeStamp = new BigNumber(currentTime.toString());
            let futureEndTime = timeStamp.plus(lotto.newLotto.closeIncrease);
            // Setting the time forward 
            await lotteryInstance.setCurrentTime(futureEndTime.toString());
            // Claiming winnings 
            await lotteryInstance.connect(buyer).claimReward(
                1,
                userTicketIds[50].toString()
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
                lotto.newLotto.win.match_three.toString(),
                "User won incorrect amount"
            );
        });
        /**
         * Testing that claiming numbers (2 match) changes the users balance
         * correctly. 
         */
        it("Claiming winning numbers (2 match)", async function () {
            // Getting the price to buy
            let prices = await lotteryInstance.costToBuyTicketsWithDiscount(
                1,
                1
            );
            // Sending the buyer the needed amount of cybar
            await cybarInstance.connect(owner).transfer(
                buyer.address,
                prices[2]
            );
            // Approving lotto to spend cost
            await cybarInstance.connect(buyer).approve(
                lotteryInstance.address,
                prices[2]
            );
            let altered = lotto.newLotto.win.winningNumbersArr;
            altered[0] = 0;
            altered[1] = 0;
            await lotteryInstance.connect(buyer).batchBuyLottoTicket(
                1,
                1,
                altered
            );
            // Setting current time so that drawing is correct
            // Getting the current block timestamp
            let currentTime = await lotteryInstance.getCurrentTime();
            // Converting to a BigNumber for manipulation 
            let timeStamp = new BigNumber(currentTime.toString());
            // Getting the timestamp for invalid time for buying
            let futureTime = timeStamp.plus(lotto.newLotto.closeIncrease);
            // Setting the time forward 
            await lotteryInstance.setCurrentTime(futureTime.toString());
            // Getting all users bought tickets
            let userTicketIds = await lotteryNftInstance.getUserTickets(1, buyer.address);
            // Drawing the numbers
            await lotteryInstance.connect(owner).drawWinningNumbers(
                1,
                1234
            );
            let buyerCybarBalanceBefore = await cybarInstance.balanceOf(buyer.address);

            // Getting the current block timestamp
            currentTime = await lotteryInstance.getCurrentTime();
            // Converting to a BigNumber for manipulation 
            timeStamp = new BigNumber(currentTime.toString());
            let futureEndTime = timeStamp.plus(lotto.newLotto.closeIncrease);
            // Setting the time forward 
            await lotteryInstance.setCurrentTime(futureEndTime.toString());
            // Claiming winnings 
            await lotteryInstance.connect(buyer).claimReward(
                1,
                userTicketIds[50].toString()
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
                lotto.newLotto.win.match_two.toString(),
                "User won incorrect amount"
            );
        });
        /**
         * Testing that claiming numbers (1 match) changes the users balance
         * correctly. 
         */
        it("Claiming winning numbers (1 match)", async function () {
            // Getting the price to buy
            let prices = await lotteryInstance.costToBuyTicketsWithDiscount(
                1,
                1
            );
            // Sending the buyer the needed amount of cybar
            await cybarInstance.connect(owner).transfer(
                buyer.address,
                prices[2]
            );
            // Approving lotto to spend cost
            await cybarInstance.connect(buyer).approve(
                lotteryInstance.address,
                prices[2]
            );
            let altered = lotto.newLotto.win.winningNumbersArr;
            altered[0] = 0;
            altered[1] = 0;
            altered[2] = 0;
            await lotteryInstance.connect(buyer).batchBuyLottoTicket(
                1,
                1,
                altered
            );
            // Setting current time so that drawing is correct
            // Getting the current block timestamp
            let currentTime = await lotteryInstance.getCurrentTime();
            // Converting to a BigNumber for manipulation 
            let timeStamp = new BigNumber(currentTime.toString());
            // Getting the timestamp for invalid time for buying
            let futureTime = timeStamp.plus(lotto.newLotto.closeIncrease);
            // Setting the time forward 
            await lotteryInstance.setCurrentTime(futureTime.toString());
            // Getting all users bought tickets
            let userTicketIds = await lotteryNftInstance.getUserTickets(1, buyer.address);
            // Drawing the numbers
            await lotteryInstance.connect(owner).drawWinningNumbers(
                1,
                1234
            );
            let buyerCybarBalanceBefore = await cybarInstance.balanceOf(buyer.address);

            // Getting the current block timestamp
            currentTime = await lotteryInstance.getCurrentTime();
            // Converting to a BigNumber for manipulation 
            timeStamp = new BigNumber(currentTime.toString());
            let futureEndTime = timeStamp.plus(lotto.newLotto.closeIncrease);
            // Setting the time forward 
            await lotteryInstance.setCurrentTime(futureEndTime.toString());
            // Claiming winnings 
            await lotteryInstance.connect(buyer).claimReward(
                1,
                userTicketIds[50].toString()
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
                lotto.newLotto.win.match_one.toString(),
                "User won incorrect amount"
            );
        });
        /**
         * Testing that claiming numbers (0 match) changes the users balance
         * correctly. 
         */
        it("Claiming winning numbers (0 (none) match)", async function () {
            // Getting the price to buy
            let prices = await lotteryInstance.costToBuyTicketsWithDiscount(
                1,
                1
            );
            // Sending the buyer the needed amount of cybar
            await cybarInstance.connect(owner).transfer(
                buyer.address,
                prices[2]
            );
            // Approving lotto to spend cost
            await cybarInstance.connect(buyer).approve(
                lotteryInstance.address,
                prices[2]
            );
            let altered = lotto.newLotto.win.winningNumbersArr;
            altered[0] = 0;
            altered[1] = 0;
            altered[2] = 0;
            altered[3] = 0;
            await lotteryInstance.connect(buyer).batchBuyLottoTicket(
                1,
                1,
                altered
            );
            // Setting current time so that drawing is correct
            // Getting the current block timestamp
            let currentTime = await lotteryInstance.getCurrentTime();
            // Converting to a BigNumber for manipulation 
            let timeStamp = new BigNumber(currentTime.toString());
            // Getting the timestamp for invalid time for buying
            let futureTime = timeStamp.plus(lotto.newLotto.closeIncrease);
            // Setting the time forward 
            await lotteryInstance.setCurrentTime(futureTime.toString());
            // Getting all users bought tickets
            let userTicketIds = await lotteryNftInstance.getUserTickets(1, buyer.address);
            // Drawing the numbers
            await lotteryInstance.connect(owner).drawWinningNumbers(
                1,
                1234
            );
            let buyerCybarBalanceBefore = await cybarInstance.balanceOf(buyer.address);

            // Getting the current block timestamp
            currentTime = await lotteryInstance.getCurrentTime();
            // Converting to a BigNumber for manipulation 
            timeStamp = new BigNumber(currentTime.toString());
            let futureEndTime = timeStamp.plus(lotto.newLotto.closeIncrease);
            // Setting the time forward 
            await lotteryInstance.setCurrentTime(futureEndTime.toString());
            // Claiming winnings 
            await lotteryInstance.connect(buyer).claimReward(
                1,
                userTicketIds[50].toString()
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
         * Testing that a claim cannot happen while the lottery is still active
         */
        it("Invalid claim (incorrect time)", async function () {
            // Setting current time so that drawing is correct
            // Getting the current block timestamp
            let currentTime = await lotteryInstance.getCurrentTime();
            // Converting to a BigNumber for manipulation 
            let timeStamp = new BigNumber(currentTime.toString());
            // Getting the timestamp for invalid time for buying
            let futureTime = timeStamp.plus(lotto.newLotto.closeIncrease);
            // Setting the time forward 
            await lotteryInstance.setCurrentTime(futureTime.toString());
            // Getting all users bought tickets
            let userTicketIds = await lotteryNftInstance.getUserTickets(1, buyer.address);
            // Drawing the numbers
            await lotteryInstance.connect(owner).drawWinningNumbers(
                1,
                1234
            );
            // set timer
            await lotteryInstance.setCurrentTime(currentTime.toString());
            // Claiming winnings 
            await expect(
                lotteryInstance.connect(buyer).claimReward(
                    1,
                    userTicketIds[25].toString()
                )
            ).to.be.revertedWith(lotto.errors.invalid_claim_time);
        });
        /**
         * Testing that a claim cannot happen until the winning numbers are
         * chosen. 
         */
        it("Invalid claim (winning numbers not chosen)", async function () {
            // Getting all users bought tickets
            let userTicketIds = await lotteryNftInstance.getUserTickets(1, buyer.address);
            // Getting the current block timestamp
            let currentTime = await lotteryInstance.getCurrentTime();
            // Converting to a BigNumber for manipulation 
            let timeStamp = new BigNumber(currentTime.toString());
            let futureEndTime = timeStamp.plus(lotto.newLotto.closeIncrease);
            // Setting the time forward 
            await lotteryInstance.setCurrentTime(futureEndTime.toString());
            // Claiming winnings 
            await expect(
                lotteryInstance.connect(buyer).claimReward(
                    1,
                    userTicketIds[25].toString()
                )
            ).to.be.revertedWith(lotto.errors.invalid_claim_draw);
        });
        /**
         * Testing that only the owner of a token can claim winnings
         */
        it("Invalid claim (not owner)", async function () {
            // Setting current time so that drawing is correct
            // Getting the current block timestamp
            let currentTime = await lotteryInstance.getCurrentTime();
            // Converting to a BigNumber for manipulation 
            let timeStamp = new BigNumber(currentTime.toString());
            // Getting the timestamp for invalid time for buying
            let futureTime = timeStamp.plus(lotto.newLotto.closeIncrease);
            // Setting the time forward 
            await lotteryInstance.setCurrentTime(futureTime.toString());
            // Getting all users bought tickets
            let userTicketIds = await lotteryNftInstance.getUserTickets(1, buyer.address);
            // Drawing the numbers
            await lotteryInstance.connect(owner).drawWinningNumbers(
                1,
                1234
            );
            // Getting the current block timestamp
            currentTime = await lotteryInstance.getCurrentTime();
            // Converting to a BigNumber for manipulation 
            timeStamp = new BigNumber(currentTime.toString());
            let futureEndTime = timeStamp.plus(lotto.newLotto.closeIncrease);
            // Setting the time forward 
            await lotteryInstance.setCurrentTime(futureEndTime.toString());
            // Claiming winnings 
            await expect(
                lotteryInstance.connect(owner).claimReward(
                    1,
                    userTicketIds[25].toString()
                )
            ).to.be.revertedWith(lotto.errors.invalid_claim_owner);
        });
        /**
         * Testing that a ticket cannot be claimed twice
         */
        it("Invalid claim (already claimed)", async function () {
            // Setting current time so that drawing is correct
            // Getting the current block timestamp
            let currentTime = await lotteryInstance.getCurrentTime();
            // Converting to a BigNumber for manipulation 
            let timeStamp = new BigNumber(currentTime.toString());
            // Getting the timestamp for invalid time for buying
            let futureTime = timeStamp.plus(lotto.newLotto.closeIncrease);
            // Setting the time forward 
            await lotteryInstance.setCurrentTime(futureTime.toString());
            // Getting all users bought tickets
            let userTicketIds = await lotteryNftInstance.getUserTickets(1, buyer.address);
            // Drawing the numbers
            await lotteryInstance.connect(owner).drawWinningNumbers(
                1,
                1234
            );
            // Getting the current block timestamp
            currentTime = await lotteryInstance.getCurrentTime();
            // Converting to a BigNumber for manipulation 
            timeStamp = new BigNumber(currentTime.toString());
            let futureEndTime = timeStamp.plus(lotto.newLotto.closeIncrease);
            // Setting the time forward 
            await lotteryInstance.setCurrentTime(futureEndTime.toString());
            // Claiming winnings 
            await lotteryInstance.connect(buyer).claimReward(
                1,
                userTicketIds[25].toString()
            );
            // Claiming winnings again
            await expect(
                lotteryInstance.connect(buyer).claimReward(
                    1,
                    userTicketIds[25].toString()
                )
            ).to.be.revertedWith(lotto.errors.invalid_claim_duplicate);
        });
        /**
         * Tests that numbers outside of range are rejected on claim
         */
        it("Invalid claim (numbers out of range)", async function () {
            // Getting the price to buy
            let prices = await lotteryInstance.costToBuyTicketsWithDiscount(
                1,
                1
            );
            // Sending the buyer the needed amount of cybar
            await cybarInstance.connect(owner).transfer(
                buyer.address,
                prices[2]
            );
            // Approving lotto to spend cost
            await cybarInstance.connect(buyer).approve(
                lotteryInstance.address,
                prices[2]
            );
            await lotteryInstance.connect(buyer).batchBuyLottoTicket(
                1,
                1,
                lotto.errorData.ticketNumbers
            );
            // Setting current time so that drawing is correct
            // Getting the current block timestamp
            let currentTime = await lotteryInstance.getCurrentTime();
            // Converting to a BigNumber for manipulation 
            let timeStamp = new BigNumber(currentTime.toString());
            // Getting the timestamp for invalid time for buying
            let futureTime = timeStamp.plus(lotto.newLotto.closeIncrease);
            // Setting the time forward 
            await lotteryInstance.setCurrentTime(futureTime.toString());
            // Getting all users bought tickets
            let userTicketIds = await lotteryNftInstance.getUserTickets(1, buyer.address);
            // Drawing the numbers
            await lotteryInstance.connect(owner).drawWinningNumbers(
                1,
                1234
            );
            // Getting the current block timestamp
            currentTime = await lotteryInstance.getCurrentTime();
            // Converting to a BigNumber for manipulation 
            timeStamp = new BigNumber(currentTime.toString());
            let futureEndTime = timeStamp.plus(lotto.newLotto.closeIncrease);
            // Setting the time forward 
            await lotteryInstance.setCurrentTime(futureEndTime.toString());
            // Claiming winnings with invalid numbers
            await expect(
                lotteryInstance.connect(buyer).claimReward(
                    1,
                    userTicketIds[50].toString()
                )
            ).to.be.revertedWith(lotto.errors.invalid_numbers_range);
        });

        it("Invalid claim (ticket for different lottery)", async function () {
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
            // Getting the price to buy
            let prices = await lotteryInstance.costToBuyTicketsWithDiscount(
                2,
                1
            );
            // Sending the buyer the needed amount of cybar
            await cybarInstance.connect(owner).transfer(
                buyer.address,
                prices[2]
            );
            // Approving lotto to spend cost
            await cybarInstance.connect(buyer).approve(
                lotteryInstance.address,
                prices[2]
            );
            await lotteryInstance.connect(buyer).batchBuyLottoTicket(
                2,
                1,
                lotto.newLotto.win.winningNumbersArr
            );
            // Setting current time so that drawing is correct
            // Getting the current block timestamp
            currentTime = await lotteryInstance.getCurrentTime();
            // Converting to a BigNumber for manipulation 
            timeStamp = new BigNumber(currentTime.toString());
            // Getting the timestamp for invalid time for buying
            let futureTime = timeStamp.plus(lotto.newLotto.closeIncrease);
            // Setting the time forward 
            await lotteryInstance.setCurrentTime(futureTime.toString());
            // Getting all users bought tickets
            let userTicketIds = await lotteryNftInstance.getUserTickets(2, buyer.address);
            // Drawing the numbers
            await lotteryInstance.connect(owner).drawWinningNumbers(
                1,
                1234
            );
            // Getting the current block timestamp
            currentTime = await lotteryInstance.getCurrentTime();
            // Converting to a BigNumber for manipulation 
            timeStamp = new BigNumber(currentTime.toString());
            let futureEndTime = timeStamp.plus(lotto.newLotto.closeIncrease);
            // Setting the time forward 
            await lotteryInstance.setCurrentTime(futureEndTime.toString());
            // Claiming winnings with invalid numbers
            await expect(
                lotteryInstance.connect(buyer).claimReward(
                    1,
                    userTicketIds[0].toString()
                )
            ).to.be.revertedWith(lotto.errors.invalid_claim_lottery);
        });
    });
});
