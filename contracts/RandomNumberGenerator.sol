// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

contract RandomNumberGenerator {
    AggregatorV3Interface internal priceFeed;
    address public lottery;

    modifier onlyLottery() {
        require(msg.sender == lottery, "Only Lottery can call function");
        _;
    }

    /**
     * Network: Fantom
     * Aggregator: BTC/USD
     * Mainnet-Address: 0x8e94C22142F4A64b99022ccDd994f4e9EC86E4B4
     * Testnet-Address: 0x65E8d79f3e8e36fE48eC31A2ae935e92F5bBF529
     */
    constructor(address _aggregatorInterface, address _lottery) {
        priceFeed = AggregatorV3Interface(_aggregatorInterface);
        lottery = _lottery;
    }

    /**
     * Requests randomness from a user-provided seed
     */
    function getRandomNumber(uint256 userProvidedSeed)
        public
        onlyLottery
        returns (uint256)
    {
        (
            uint80 roundID,
            int256 price,
            uint256 startedAt,
            uint256 timeStamp,
            uint80 answeredInRound
        ) = priceFeed.latestRoundData();
        // Encodes the random number
        bytes32 hashOfRandom = keccak256(
            abi.encodePacked(
                roundID,
                price,
                startedAt,
                timeStamp,
                answeredInRound,
                userProvidedSeed
            )
        );
        // Casts random number hash into uint256
        return uint256(hashOfRandom);
    }
}
