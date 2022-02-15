// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

import "@chainlink/contracts/src/v0.6/interfaces/AggregatorV3Interface.sol";
import "hardhat/console.sol";
// Inherited allowing for ownership of contract
import "@openzeppelin/contracts/access/Ownable.sol";

contract RandomNumberGenerator is Ownable {
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
    constructor(address _aggregatorInterface, address _lottery) public {
        priceFeed = AggregatorV3Interface(_aggregatorInterface);
        lottery = _lottery;
    }

    /**
     * Requests randomness from a user-provided seed
     */
    function getRandomNumber(uint256 userProvidedSeed)
        public
        view
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
        uint256 randomNumber = uint256(hashOfRandom);
        return randomNumber;
    }
}
