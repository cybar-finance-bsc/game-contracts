const { ethers } = require("ethers");
const { BigNumber } = require("bignumber.js");
var seedrandom = require('seedrandom');


const RNG = {
    dataFeedAddress: {
        BTC_USD: {
            MainNet: "0x8e94C22142F4A64b99022ccDd994f4e9EC86E4B4",
            TestNet: "0x65E8d79f3e8e36fE48eC31A2ae935e92F5bBF529"
        }
    },
    test_setup: {
        userSeed: {
            seedOne: 42,
            seedTwo: 43
        },
    },
    test_result: {
        nominal_case: {
            type: "number",
        }
    },
    errors: {
        invalid_data_feed: "Invalid data feed address",
        invalid_seed: "Invalid seed",
        wrong_lottery_address: "Only Lottery can call function",
    }
}

module.exports = {
    RNG,
}