const { expect, assert } = require("chai");
const { network } = require("hardhat");
const {
    RNG,
} = require("./settings/rngSettings.js");

describe("RandomNumberGenerator contract", function () {
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
    // Creating the users
    let lottery, stranger;

    beforeEach(async () => {
        // Getting the signers provided by ethers
        const signers = await ethers.getSigners();
        // Creating the active wallets for use
        lottery = signers[0];
        stranger = signers[1];
        randGenContract = await ethers.getContractFactory("RandomNumberGenerator");
        randGenInstance = await randGenContract.deploy(
            RNG.dataFeedAddress.BTC_USD.MainNet,
            lottery.address,
        );
        await randGenInstance.deployed();
    });

    describe("Basic functions", function () {
        /**
         * Tests that in the nominal case nothing goes wrong
         */
        it("Nominal case", async function () {
            let randomNumber = await (
                randGenInstance
                    .connect(lottery)
                    .getRandomNumber(RNG.test_setup.userSeed.seedOne)
            );
            let parsedRandomNumber = parseInt(randomNumber.toString());
            // console.log(parsedRandomNumber);
            assert.equal(
                typeof (parsedRandomNumber),
                RNG.test_result.nominal_case.type,
                "Return value can be cast to int"
            );
        });
        it("Invoke by stranger", async function () {
            await expect(
                randGenInstance
                    .connect(stranger)
                    .getRandomNumber(RNG.test_setup.userSeed.seedOne)
            ).to.be.revertedWith(RNG.errors.wrong_lottery_address);
        });
        it("Different seeds", async function () {
            let randomNumbers = [];
            for (let i = 0; i < 10; i++) {
                let ranNum = await (
                    randGenInstance
                        .connect(lottery)
                        .getRandomNumber(i)
                );
                let parsedNum = parseInt(ranNum.toString());
                randomNumbers.push(parsedNum);
            }
            assert.equal(
                (new Set(randomNumbers)).size,
                randomNumbers.length,
                "Return value can be cast to int"
            );
        });
    });
});
