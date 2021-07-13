//SPDX-License-Identifier: MIT
pragma solidity >0.6.0;
pragma experimental ABIEncoderV2;
// Imported OZ helper contracts
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/proxy/Initializable.sol";
// Inherited allowing for ownership of contract
import "@openzeppelin/contracts/access/Ownable.sol";
// Allows for intergration with ChainLink VRF
import "./IRandomNumberGenerator.sol";
// Interface for Russian Roulette NFT to mint tokens
import "./IRussianRouletteNFT.sol";
// Allows for time manipulation. Set to 0x address on test/mainnet deploy
import "./Testable.sol";
// Safe math
import "@openzeppelin/contracts/math/SafeMath.sol";
import "./SafeMath32.sol";
import "./SafeMath16.sol";
import "./SafeMath8.sol";

contract RussianRoulette is Ownable, Initializable, Testable {
    // Libraries
    // Safe math
    using SafeMath for uint256;
    using SafeMath32 for uint32;
    using SafeMath16 for uint16;
    using SafeMath8 for uint8;
    // Safe ERC20
    using SafeERC20 for IERC20;
    // Address functionality
    using Address for address;

    // State variables
    // Instance of Cybar token (collateral currency for russian roulette)
    IERC20 internal cybar_;
    // Storing of the NFT
    IRussianRouletteNFT internal nft_;
    // Storing of the randomness generator
    IRandomNumberGenerator internal randomGenerator_;
    // Request ID for random number
    bytes32 internal requestId_;
    // Counter for russian roulette IDs
    uint256 private russianRouletteIdCounter;

    // Max range for numbers (starting at 0)
    uint16 public maxValidRange_;

    // Represents the status of the russian roulette game
    enum Status {
        NotStarted, // The russian roulette has not started yet
        Open, // The russian roulette is open for ticket purchases
        Closed, // The russian roulette is no longer open for ticket purchases
        Completed // The russian roulette has been closed and the numberdrawn
    }
    // All the needed info around a game of russian roulette
    struct RussianRouletteInfo {
        uint256 russianRouletteId; // ID for russian roulette
        Status russianRouletteStatus; // Status for russian roulette
        uint256 prizePoolInCybar; // The amount of cybar for prize money
        uint256 costPerTicket; // Cost per ticket in $cybar
        uint256 startingTimestamp; // Block timestamp for start of russian roulette
        uint256 closingTimestamp; // Block timestamp for end of entries
        uint8 winningNumber; // The winning number
        uint32[] ticketDistribution; // Distribution of tickets over the possible different numbers
    }
    // Russian Roulette ID's to info
    mapping(uint256 => RussianRouletteInfo) internal allRussianRoulettes;

    //-------------------------------------------------------------------------
    // EVENTS
    //-------------------------------------------------------------------------

    event NewBatchMint(
        address indexed minter,
        uint256[] ticketIDs,
        uint8[] numbers,
        uint256 totalCost
    );

    event RequestNumber(uint256 russianRouletteId, bytes32 requestId);

    event UpdatedMaxRange(address admin, uint16 newMaxRange);

    event RussianRouletteOpen(uint256 russianRouletteId, uint256 ticketSupply);

    event RussianRouletteClose(uint256 russianRouletteId, uint256 ticketSupply);

    //-------------------------------------------------------------------------
    // MODIFIERS
    //-------------------------------------------------------------------------

    modifier onlyRandomGenerator() {
        require(
            msg.sender == address(randomGenerator_),
            "Only random generator"
        );
        _;
    }

    modifier notContract() {
        require(!address(msg.sender).isContract(), "contract not allowed");
        require(msg.sender == tx.origin, "proxy contract not allowed");
        _;
    }

    //-------------------------------------------------------------------------
    // CONSTRUCTOR
    //-------------------------------------------------------------------------

    constructor(
        address _cybar,
        address _timer,
        uint16 _maxValidNumberRange
    ) public Testable(_timer) {
        require(_cybar != address(0), "Contracts cannot be 0 address");
        require(_maxValidNumberRange != 0, "Max range cannot be 0");
        cybar_ = IERC20(_cybar);
        maxValidRange_ = _maxValidNumberRange;
    }

    function initialize(
        address _russianRouletteNFT,
        address _IRandomNumberGenerator
    ) external initializer onlyOwner() {
        require(
            _russianRouletteNFT != address(0) &&
                _IRandomNumberGenerator != address(0),
            "Contracts cannot be 0 address"
        );
        nft_ = IRussianRouletteNFT(_russianRouletteNFT);
        randomGenerator_ = IRandomNumberGenerator(_IRandomNumberGenerator);
    }

    //-------------------------------------------------------------------------
    // VIEW FUNCTIONS
    //-------------------------------------------------------------------------

    function costToBuyTickets(
        uint256 _russianRouletteId,
        uint256 _numberOfTickets
    ) external view returns (uint256) {
        uint256 pricePer = allRussianRoulettes[_russianRouletteId]
        .costPerTicket;
        uint256 totalCost = pricePer.mul(_numberOfTickets);
        return totalCost;
    }

    function getBasicRussianRouletteInfo(uint256 _russianRouletteId)
        external
        view
        returns (RussianRouletteInfo memory)
    {
        return allRussianRoulettes[_russianRouletteId];
    }

    function getMaxRange() external view returns (uint16) {
        return maxValidRange_;
    }

    //-------------------------------------------------------------------------
    // STATE MODIFYING FUNCTIONS
    //-------------------------------------------------------------------------

    //-------------------------------------------------------------------------
    // Restricted Access Functions (onlyOwner)

    function updateMaxRange(uint16 _newMaxRange) external onlyOwner() {
        require(maxValidRange_ != _newMaxRange, "Cannot set to current size");
        require(maxValidRange_ != 0, "Max range cannot be 0");
        maxValidRange_ = _newMaxRange;

        emit UpdatedMaxRange(msg.sender, _newMaxRange);
    }

    function drawWinningNumber(uint256 _russianRouletteId, uint256 _seed)
        external
        onlyOwner()
    {
        // Checks that the russian roulette is past the closing block
        require(
            allRussianRoulettes[_russianRouletteId].closingTimestamp <=
                getCurrentTime(),
            "Cannot set winning number during russian roulette"
        );
        // Checks russian roulette number have not already been drawn
        require(
            allRussianRoulettes[_russianRouletteId].russianRouletteStatus ==
                Status.Open,
            "Russian Roulette State incorrect for draw"
        );
        // Sets russian roulette status to closed
        allRussianRoulettes[_russianRouletteId].russianRouletteStatus = Status
        .Closed;
        // Requests a random number from the generator
        requestId_ = randomGenerator_.getRandomNumber(
            _russianRouletteId,
            _seed
        );
        // Emits that random number has been requested
        emit RequestNumber(_russianRouletteId, requestId_);
    }

    function numberDrawn(
        uint256 _russianRouletteId,
        bytes32 _requestId,
        uint256 _randomNumber
    ) external onlyRandomGenerator() {
        require(
            allRussianRoulettes[_russianRouletteId].russianRouletteStatus ==
                Status.Closed,
            "Draw number first"
        );
        if (requestId_ == _requestId) {
            allRussianRoulettes[_russianRouletteId]
            .russianRouletteStatus = Status.Completed;
            allRussianRoulettes[_russianRouletteId].winningNumber = _cast(
                _randomNumber
            );
        }

        emit RussianRouletteClose(_russianRouletteId, nft_.getTotalSupply());
    }

    /**
     * @param   _prizePoolInCybar The amount of cybar available to win in this
     *          game of russian roulette.
     * @param   _costPerTicket Cost per ticket.
     * @param   _startingTimestamp The block timestamp for the beginning of the
     *          game of russian roulette.
     * @param   _closingTimestamp The block timestamp after which no more tickets
     *          will be sold for the game of russian roulette. Note that this
     *          timestamp MUST be after the starting block timestamp.
     */
    function createNewRussianRoulette(
        uint256 _prizePoolInCybar,
        uint256 _costPerTicket,
        uint256 _startingTimestamp,
        uint256 _closingTimestamp
    ) external onlyOwner() returns (uint256 russianRouletteId) {
        require(
            _prizePoolInCybar != 0 && _costPerTicket != 0,
            "Prize or cost cannot be 0"
        );
        require(
            _startingTimestamp != 0 && _startingTimestamp < _closingTimestamp,
            "Timestamps for russian roulette invalid"
        );
        // Incrementing russian roulette ID
        russianRouletteIdCounter = russianRouletteIdCounter.add(1);
        russianRouletteId = russianRouletteIdCounter;
        uint8 winningNumber;
        Status russianRouletteStatus;
        if (_startingTimestamp >= getCurrentTime()) {
            russianRouletteStatus = Status.Open;
        } else {
            russianRouletteStatus = Status.NotStarted;
        }
        uint32[] memory ticketDistribution_ = new uint32[](maxValidRange_);
        // Saving data in struct
        RussianRouletteInfo memory newRussianRoulette = RussianRouletteInfo(
            russianRouletteId,
            russianRouletteStatus,
            _prizePoolInCybar,
            _costPerTicket,
            _startingTimestamp,
            _closingTimestamp,
            winningNumber,
            ticketDistribution_
        );
        allRussianRoulettes[russianRouletteId] = newRussianRoulette;

        // Emitting important information around new russian roulette.
        emit RussianRouletteOpen(russianRouletteId, nft_.getTotalSupply());
    }

    function withdrawCybar(uint256 _amount) external onlyOwner() {
        cybar_.transfer(msg.sender, _amount);
    }

    //-------------------------------------------------------------------------
    // General Access Functions

    function batchBuyRussianRouletteTicket(
        uint256 _russianRouletteId,
        uint8 _numberOfTickets,
        uint8[] calldata chosenNumberForEachTicket
    ) external notContract() {
        require(
            _numberOfTickets == chosenNumberForEachTicket.length,
            "Only one number per ticket"
        );
        // Ticket numbers within range
        for (uint256 i = 0; i < _numberOfTickets; i++) {
            require(
                1 <= chosenNumberForEachTicket[i] &&
                    chosenNumberForEachTicket[i] <= 6,
                "Ticket number out of range"
            );
        }
        // Ensuring the russian roulette is within a valid time
        require(
            getCurrentTime() >=
                allRussianRoulettes[_russianRouletteId].startingTimestamp,
            "Invalid time for mint:start"
        );
        require(
            getCurrentTime() <
                allRussianRoulettes[_russianRouletteId].closingTimestamp,
            "Invalid time for mint:end"
        );
        if (
            allRussianRoulettes[_russianRouletteId].russianRouletteStatus ==
            Status.NotStarted
        ) {
            if (
                allRussianRoulettes[_russianRouletteId].startingTimestamp >=
                getCurrentTime()
            ) {
                allRussianRoulettes[_russianRouletteId]
                .russianRouletteStatus = Status.Open;
            }
        }
        require(
            allRussianRoulettes[_russianRouletteId].russianRouletteStatus ==
                Status.Open,
            "Russian Roulette not in state for mint"
        );
        require(_numberOfTickets <= 50, "Batch mint too large");

        // Getting the cost and discount for the token purchase
        uint256 totalCost = this.costToBuyTickets(
            _russianRouletteId,
            _numberOfTickets
        );
        // Transfers the required Cybar to this contract
        cybar_.transferFrom(msg.sender, address(this), totalCost);
        // Batch mints the user their tickets
        uint256[] memory ticketIds = nft_.batchMint(
            msg.sender,
            _russianRouletteId,
            _numberOfTickets,
            chosenNumberForEachTicket
        );
        for (uint256 i = 0; i < _numberOfTickets; i++) {
            uint8 chosenNumber = chosenNumberForEachTicket[i];
            allRussianRoulettes[_russianRouletteId].ticketDistribution[
                chosenNumber - 1
            ] = allRussianRoulettes[_russianRouletteId].ticketDistribution[
                chosenNumber - 1
            ];
        }
        // Emitting event with all information
        emit NewBatchMint(
            msg.sender,
            ticketIds,
            chosenNumberForEachTicket,
            totalCost
        );
    }

    function claimReward(uint256 _russianRouletteId, uint256 _tokenId)
        external
        notContract()
    {
        // Checking the russian roulette is in a valid time for claiming
        require(
            allRussianRoulettes[_russianRouletteId].closingTimestamp <=
                getCurrentTime(),
            "Wait till end to claim"
        );
        // Checks the russian roulette winning number are available
        require(
            allRussianRoulettes[_russianRouletteId].russianRouletteStatus ==
                Status.Completed,
            "Winning Number not chosen yet"
        );
        require(
            nft_.getOwnerOfTicket(_tokenId) == msg.sender,
            "Only the owner can claim"
        );
        // Sets the claim of the ticket to true (if claimed, will revert)
        require(
            nft_.claimTicket(_tokenId, _russianRouletteId),
            "Number for ticket invalid"
        );
        // Boolean whether the winning number was matched
        uint8 matchingNumber = nft_.getTicketNumber(_tokenId);
        bool matching = nft_.getTicketNumber(_tokenId) ==
            allRussianRoulettes[_russianRouletteId].winningNumber;
        // Getting the prize amount for those matching tickets
        uint256 prizeAmount = _prizeForMatching(
            matching,
            matchingNumber,
            _russianRouletteId
        );
        // Removing the prize amount from the pool
        allRussianRoulettes[_russianRouletteId]
        .prizePoolInCybar = allRussianRoulettes[_russianRouletteId]
        .prizePoolInCybar
        .sub(prizeAmount);
        // Transfering the user their winnings
        cybar_.safeTransfer(address(msg.sender), prizeAmount);
    }

    function batchClaimRewards(
        uint256 _russianRouletteId,
        uint256[] calldata _tokenIds
    ) external notContract() {
        require(_tokenIds.length <= 50, "Batch claim too large");
        // Checking the russian roulette is in a valid time for claiming
        require(
            allRussianRoulettes[_russianRouletteId].closingTimestamp <=
                getCurrentTime(),
            "Wait till end to claim"
        );
        // Checks the russian roulette winning number is available
        require(
            allRussianRoulettes[_russianRouletteId].russianRouletteStatus ==
                Status.Completed,
            "Winning Number not chosen yet"
        );
        // Creates a storage for all winnings
        uint256 totalPrize = 0;
        // Loops through each submitted token
        for (uint256 i = 0; i < _tokenIds.length; i++) {
            // Checks user is owner (will revert entire call if not)
            require(
                nft_.getOwnerOfTicket(_tokenIds[i]) == msg.sender,
                "Only the owner can claim"
            );
            // If token has already been claimed, skip token
            if (nft_.getTicketClaimStatus(_tokenIds[i])) {
                continue;
            }
            // Claims the ticket (will only revert if numbers invalid)
            require(
                nft_.claimTicket(_tokenIds[i], _russianRouletteId),
                "Number for ticket invalid"
            );
            // Boolean whether the winning number was matched
            uint8 matchingNumber = nft_.getTicketNumber(_tokenIds[i]);
            bool matching = nft_.getTicketNumber(_tokenIds[i]) ==
                allRussianRoulettes[_russianRouletteId].winningNumber;
            // Getting the prize amount for those matching tickets
            uint256 prizeAmount = _prizeForMatching(
                matching,
                matchingNumber,
                _russianRouletteId
            );
            // Removing the prize amount from the pool
            allRussianRoulettes[_russianRouletteId]
            .prizePoolInCybar = allRussianRoulettes[_russianRouletteId]
            .prizePoolInCybar
            .sub(prizeAmount);
            totalPrize = totalPrize.add(prizeAmount);
        }
        // Transferring the user their winnings
        cybar_.safeTransfer(address(msg.sender), totalPrize);
    }

    //-------------------------------------------------------------------------
    // INTERNAL FUNCTIONS
    //-------------------------------------------------------------------------

    /**
     * @param   _matching: Boolean representing whether the correct number was chosen
     * @param   _russianRouletteId: The ID of the russian roulette the user is claiming on
     * @return  uint256: The prize amount in cybar the user is entitled to
     */
    function _prizeForMatching(
        bool _matching,
        uint8 _winningNumber,
        uint256 _russianRouletteId
    ) internal view returns (uint256) {
        if (!_matching) {
            return 0;
        }
        uint256 prizePerTicket = allRussianRoulettes[_russianRouletteId]
        .prizePoolInCybar
        .div(
            allRussianRoulettes[_russianRouletteId].ticketDistribution[
                _winningNumber
            ]
        );
        return prizePerTicket;
    }

    function _cast(uint256 _randomNumber) internal view returns (uint8) {
        // Encodes the random number with its position in loop
        bytes32 hashOfRandom = keccak256(abi.encodePacked(_randomNumber));
        // Casts random number hash into uint256
        uint256 numberRepresentation = uint256(hashOfRandom);
        // Casting the uint256 to the desired interval
        uint8 winningNumber = uint8(numberRepresentation.mod(maxValidRange_));
        return winningNumber;
    }
}
