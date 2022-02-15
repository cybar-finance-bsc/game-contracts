const { ethers } = require("ethers");
const { BigNumber } = require("bignumber.js");
var seedrandom = require('seedrandom');


const local_lotto = {
    setup: {
        sizeOfLottery: 4,
        maxValidRange: 20,
        bucket: {
            one: 20,
            two: 50
        },
        bucketDiscount: {
            one: 5,
            two: 10,
            three: 15
        }
    },
    buy: {
        cybar: ethers.utils.parseUnits("10000000", 18),
    },
    chainLink: {
        dataFeedAddress: "0x8e94C22142F4A64b99022ccDd994f4e9EC86E4B4",
        fee: ethers.utils.parseUnits("1", 19)
    },
    newLotto: {
        distribution: [5, 10, 35, 50],
        prize: ethers.utils.parseUnits("1000", 18),
        cost: ethers.utils.parseUnits("10", 18),
        closeIncrease: 10000,
        endIncrease: 20000,
        win: {
            blankWinningNumbers: "0,0,0,0",
            simpleWinningNumbers: "1,2,3,4",
            winningNumbers: "14,15,16,2",
            winningNumbersArr: [14, 15, 16, 2],
            match_all: ethers.utils.parseUnits("500", 18),
            match_three: ethers.utils.parseUnits("350", 18),
            match_two: ethers.utils.parseUnits("33.333333333333333333", 18),
            match_one: ethers.utils.parseUnits("3.846153846153846153", 18),
        }
    },
};

const lottoNFT = {
    newLottoNft: {
        uri: "https://testing.com/tokens/\{id\}"
    }
}

module.exports = {
    local_lotto,
    lottoNFT,
    BigNumber,
}