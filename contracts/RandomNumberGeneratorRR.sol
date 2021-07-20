//SPDX-License-Identifier: MIT
pragma solidity 0.6.12;

import "@chainlink/contracts/src/v0.6/VRFConsumerBase.sol";
import "./IRussianRoulette.sol";

contract RandomNumberGeneratorRR is VRFConsumerBase {
    bytes32 internal keyHash;
    uint256 internal fee;
    address internal requester;
    uint256 public randomResult;
    uint256 public currentRussianRouletteId;

    address public russianRoulette;

    modifier onlyRussianRoulette() {
        require(
            msg.sender == russianRoulette,
            "Only RussianRoulette can call function"
        );
        _;
    }

    constructor(
        address _vrfCoordinator,
        address _linkToken,
        address _russianRoulette,
        bytes32 _keyHash,
        uint256 _fee
    ) public VRFConsumerBase(_vrfCoordinator, _linkToken) {
        keyHash = _keyHash;
        fee = _fee;
        russianRoulette = _russianRoulette;
    }

    /**
     * Requests randomness from a user-provided seed
     */
    function getRandomNumber(
        uint256 russianRouletteId,
        uint256 userProvidedSeed
    ) public onlyRussianRoulette() returns (bytes32 requestId) {
        require(keyHash != bytes32(0), "Must have valid key hash");
        require(
            LINK.balanceOf(address(this)) >= fee,
            "Not enough LINK - fill contract with faucet"
        );
        requester = msg.sender;
        currentRussianRouletteId = russianRouletteId;
        return requestRandomness(keyHash, fee, userProvidedSeed);
    }

    /**
     * Callback function used by VRF Coordinator
     */
    function fulfillRandomness(bytes32 requestId, uint256 randomness)
        internal
        override
    {
        IRussianRoulette(requester).numberDrawn(
            currentRussianRouletteId,
            requestId,
            randomness
        );
        randomResult = randomness;
    }
}
