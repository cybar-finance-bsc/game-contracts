const { ethers } = require("ethers");
const { BigNumber } = require("bignumber.js");

const localRussianRoulette = {
    setup: {
        maxValidRange: 6
    },
    update: {
        maxValidRange: 8
    },
    newRussianRoulette: {
        prize: ethers.utils.parseUnits("1000", 18),
        cost: ethers.utils.parseUnits("10", 18),
        closeIncrease: 10000,
        endIncrease: 20000,
        win: {
            blankWinningNumber: "0",
            afterWinningNumber: "4",
            winningNumber: ["4"],
            loosingNumber: ["3"],
            winPrize: ethers.utils.parseUnits("500", 18),
        }
    },
    chainLink: {
        dataFeedAddress: "0x8e94C22142F4A64b99022ccDd994f4e9EC86E4B4",
        fee: ethers.utils.parseUnits("1", 19)
    },
    buy: {
        cybar: ethers.utils.parseUnits("10000000", 18),
        one: {
            cost: "10000000000000000000"
        },
        ten: {
            cost: "100000000000000000000"
        },
        fifty: {
            cost: "500000000000000000000"
        },
    },
};

const russianRouletteNFT = {
    newRussianRouletteNft: {
        uri: "https://testing.com/tokens/\{id\}"
    }
}

module.exports = {
    localRussianRoulette,
    russianRouletteNFT,
    BigNumber,
}