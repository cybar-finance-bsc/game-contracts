// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

contract RNG_Mock {
    address internal feedAddr;
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
        lottery = _lottery;
        feedAddr = _aggregatorInterface;
    }

    /**
     * Requests randomness from a user-provided seed
     */
    function getRandomNumber(uint256 userProvidedSeed)
        public
        onlyLottery
        returns (uint256)
    {
        return userProvidedSeed;
    }
}
