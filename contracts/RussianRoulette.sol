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
// Interface for Lottery NFT to mint tokens
import "./ILotteryNFT.sol";
// Allows for time manipulation. Set to 0x address on test/mainnet deploy
import "./Testable.sol";
// Safe math 
import "@openzeppelin/contracts/math/SafeMath.sol";
import "./SafeMath16.sol";
import "./SafeMath8.sol";

// TODO rename to Lottery when done
contract Lottery is Ownable, Initializable, Testable {
    // Libraries 
    // Safe math
    using SafeMath for uint256;
    using SafeMath16 for uint16;
    using SafeMath8 for uint8;
    // Safe ERC20
    using SafeERC20 for IERC20;
    // Address functionality 
    using Address for address;

    // State variables 
    // Instance of Cybar token (collateral currency for lotto)
    IERC20 internal cybar_;
    // Storing of the NFT
    ILotteryNFT internal nft_;
    // Storing of the randomness generator 
    IRandomNumberGenerator internal randomGenerator_;
    // Request ID for random number
    bytes32 internal requestId_;
    // Counter for lottery IDs 
    uint256 private lotteryIdCounter_;

    // Max range for numbers (starting at 0)
    uint16 public maxValidRange_;

    // Represents the status of the lottery
    enum Status { 
        NotStarted,     // The lottery has not started yet
        Open,           // The lottery is open for ticket purchases 
        Closed,         // The lottery is no longer open for ticket purchases
        Completed       // The lottery has been closed and the numbers drawn
    }
    // All the needed info around a lottery
    struct LottoInfo {
        uint256 lotteryID;          // ID for lotto
        Status lotteryStatus;       // Status for lotto
        uint256 prizePoolInCybar;    // The amount of cybar for prize money
        uint256 costPerTicket;      // Cost per ticket in $cybar
        uint256 startingTimestamp;      // Block timestamp for star of lotto
        uint256 closingTimestamp;       // Block timestamp for end of entries
        uint8 winningNumber;     // The winning numbers
        uint32[] ticketDistribution; // Distribution of tickets over the possible different numbers
    }
    // Lottery ID's to info
    mapping(uint256 => LottoInfo) internal allLotteries_;

    //-------------------------------------------------------------------------
    // EVENTS
    //-------------------------------------------------------------------------

    event NewBatchMint(
        address indexed minter,
        uint256[] ticketIDs,
        uint16[] numbers,
        uint256 totalCost,
        uint256 pricePaid
    );

    event RequestNumbers(uint256 lotteryId, bytes32 requestId);

    event UpdatedMaxRange(
        address admin, 
        uint16 newMaxRange
    );

    event LotteryOpen(uint256 lotteryId, uint256 ticketSupply);

    event LotteryClose(uint256 lotteryId, uint256 ticketSupply);

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
        uint16 _maxValidNumberRange,
    ) 
        Testable(_timer)
        public
    {
        require(
            _cybar != address(0),
            "Contracts cannot be 0 address"
        );
        require(
            _maxValidNumberRange != 0,
            "Lottery setup cannot be 0"
        );
        cybar_ = IERC20(_cybar);
        maxValidRange_ = _maxValidNumberRange;
        
    }

    function initialize(
        address _lotteryNFT,
        address _IRandomNumberGenerator
    ) 
        external 
        initializer
        onlyOwner() 
    {
        require(
            _lotteryNFT != address(0) &&
            _IRandomNumberGenerator != address(0),
            "Contracts cannot be 0 address"
        );
        nft_ = ILotteryNFT(_lotteryNFT);
        randomGenerator_ = IRandomNumberGenerator(_IRandomNumberGenerator);
    }

    //-------------------------------------------------------------------------
    // VIEW FUNCTIONS
    //-------------------------------------------------------------------------

    function costToBuyTickets(
        uint256 _lotteryId,
        uint256 _numberOfTickets
    ) 
        external 
        view 
        returns(uint256) 
    {
        uint256 pricePer = allLotteries_[_lotteryId].costPerTicket;
        totalCost = pricePer.mul(_numberOfTickets);
        return totalCost;
    }

    function getBasicLottoInfo(uint256 _lotteryId) external view returns(
        LottoInfo memory
    )
    {
        return allLotteries_[_lotteryId]; 
    }

    function getMaxRange() external view returns(uint16) {
        return maxValidRange_;
    }

    //-------------------------------------------------------------------------
    // STATE MODIFYING FUNCTIONS 
    //-------------------------------------------------------------------------

    //-------------------------------------------------------------------------
    // Restricted Access Functions (onlyOwner)

    function updateMaxRange(uint16 _newMaxRange) external onlyOwner() {
        require(
            maxValidRange_ != _newMaxRange,
            "Cannot set to current size"
        );
        require(
            maxValidRange_ != 0,
            "Max range cannot be 0"
        );
        maxValidRange_ = _newMaxRange;

        emit UpdatedMaxRange(
            msg.sender, 
            _newMaxRange
        );
    }

    function drawWinningNumber(
        uint256 _lotteryId, 
        uint256 _seed
    ) 
        external 
        onlyOwner() 
    {
        // Checks that the lottery is past the closing block
        require(
            allLotteries_[_lotteryId].closingTimestamp <= getCurrentTime(),
            "Cannot set winning numbers during lottery"
        );
        // Checks lottery numbers have not already been drawn
        require(
            allLotteries_[_lotteryId].lotteryStatus == Status.Open,
            "Lottery State incorrect for draw"
        );
        // Sets lottery status to closed
        allLotteries_[_lotteryId].lotteryStatus = Status.Closed;
        // Requests a random number from the generator
        requestId_ = randomGenerator_.getRandomNumber(_lotteryId, _seed);
        // Emits that random number has been requested
        emit RequestNumbers(_lotteryId, requestId_);
    }

    function numbersDrawn(
        uint256 _lotteryId,
        bytes32 _requestId, 
        uint256 _randomNumber
    ) 
        external
        onlyRandomGenerator()
    {
        require(
            allLotteries_[_lotteryId].lotteryStatus == Status.Closed,
            "Draw numbers first"
        );
        if(requestId_ == _requestId) {
            allLotteries_[_lotteryId].lotteryStatus = Status.Completed;
            allLotteries_[_lotteryId].winningNumber = _split(_randomNumber);
        }

        emit LotteryClose(_lotteryId, nft_.getTotalSupply());
    }

    /**
     * @param   _prizeDistribution An array defining the distribution of the 
     *          prize pool. I.e if a lotto has 5 numbers, the distribution could
     *          be [5, 10, 15, 20, 30] = 100%. This means if you get one number
     *          right you get 5% of the pool, 2 matching would be 10% and so on.
     * @param   _prizePoolInCybar The amount of cybar available to win in this 
     *          lottery.
     * @param   _startingTimestamp The block timestamp for the beginning of the 
     *          lottery. 
     * @param   _closingTimestamp The block timestamp after which no more tickets
     *          will be sold for the lottery. Note that this timestamp MUST
     *          be after the starting block timestamp. 
     */
    function createNewLotto(
        uint256 _prizePoolInCybar,
        uint256 _costPerTicket,
        uint256 _startingTimestamp,
        uint256 _closingTimestamp
    )
        external
        onlyOwner()
        returns(uint256 lotteryId)
    {
        require(
            _prizePoolInCybar != 0 && _costPerTicket != 0,
            "Prize or cost cannot be 0"
        );
        require(
            _startingTimestamp != 0 &&
            _startingTimestamp < _closingTimestamp,
            "Timestamps for lottery invalid"
        );
        // Incrementing lottery ID 
        lotteryIdCounter_ = lotteryIdCounter_.add(1);
        lotteryId = lotteryIdCounter_;
        uint8 winningNumber = new uint8();
        Status lotteryStatus;
        if(_startingTimestamp >= getCurrentTime()) {
            lotteryStatus = Status.Open;
        } else {
            lotteryStatus = Status.NotStarted;
        }
        // Saving data in struct
        LottoInfo memory newLottery = LottoInfo(
            lotteryId,
            lotteryStatus,
            _prizePoolInCybar,
            _costPerTicket,
            _startingTimestamp,
            _closingTimestamp,
            winningNumber
        );
        allLotteries_[lotteryId] = newLottery;

        // Emitting important information around new lottery.
        emit LotteryOpen(
            lotteryId, 
            nft_.getTotalSupply()
        );
    }

    function withdrawCybar(uint256 _amount) external onlyOwner() {
        cybar_.transfer(
            msg.sender, 
            _amount
        );
    }

    //-------------------------------------------------------------------------
    // General Access Functions

    function batchBuyLottoTicket(
        uint256 _lotteryId,
        uint8 _numberOfTickets,
        uint8[] calldata _chosenNumbersForEachTicket
    )
        external
        notContract()
    {
        // Ensuring the lottery is within a valid time
        require(
            getCurrentTime() >= allLotteries_[_lotteryId].startingTimestamp,
            "Invalid time for mint:start"
        );
        require(
            getCurrentTime() < allLotteries_[_lotteryId].closingTimestamp,
            "Invalid time for mint:end"
        );
        if(allLotteries_[_lotteryId].lotteryStatus == Status.NotStarted) {
            if(allLotteries_[_lotteryId].startingTimestamp >= getCurrentTime()) {
                allLotteries_[_lotteryId].lotteryStatus = Status.Open;
            }
        }
        require(
            allLotteries_[_lotteryId].lotteryStatus == Status.Open,
            "Lottery not in state for mint"
        );
        require(
            _numberOfTickets <= 50,
            "Batch mint too large"
        );
        // Getting the cost and discount for the token purchase
        uint256 totalCost = this.costToBuyTickets(_lotteryId, numberOfTickets);
        // Transfers the required Cybar to this contract
        cybar_.transferFrom(
            msg.sender, 
            address(this), 
            totalCost
        );
        // Batch mints the user their tickets
        uint256[] memory ticketIds = nft_.batchMint(
            msg.sender,
            _lotteryId,
            _numberOfTickets,
            _chosenNumbersForEachTicket,
            sizeOfLottery_
        );
        for(int i=0; i<_numberOfTickets; i++){
            uint8 chosenNumber = _chosenNumbersForEachTicket[i];
            allLotteries_[_lotteryId].ticketDistribution[chosenNumber].add(1);
        }
        // Emitting event with all information
        emit NewBatchMint(
            msg.sender,
            ticketIds,
            _chosenNumbersForEachTicket,
            totalCost
        );
    }


    function claimReward(uint256 _lotteryId, uint256 _tokenId) external notContract() {
        // Checking the lottery is in a valid time for claiming
        require(
            allLotteries_[_lotteryId].closingTimestamp <= getCurrentTime(),
            "Wait till end to claim"
        );
        // Checks the lottery winning numbers are available 
        require(
            allLotteries_[_lotteryId].lotteryStatus == Status.Completed,
            "Winning Numbers not chosen yet"
        );
        require(
            nft_.getOwnerOfTicket(_tokenId) == msg.sender,
            "Only the owner can claim"
        );
        // Sets the claim of the ticket to true (if claimed, will revert)
        require(
            nft_.claimTicket(_tokenId, _lotteryId),
            "Numbers for ticket invalid"
        );
        // Boolean whether the winning number was matched
        uint8 matchingNumber = nft_.getTicketNumbers(_tokenIds[i]);
        bool matching = nft_.getTicketNumbers(_tokenIds[i]) == allLotteries_[_lotteryId].winningNumbers;
        // Getting the prize amount for those matching tickets
        uint256 prizeAmount = _prizeForMatching(
            matching,
            matchingNumber,
            _lotteryId
        );
        // Removing the prize amount from the pool
        allLotteries_[_lotteryId].prizePoolInCybar = allLotteries_[_lotteryId].prizePoolInCybar.sub(prizeAmount);
        // Transfering the user their winnings
        cybar_.safeTransfer(address(msg.sender), prizeAmount);
    }

    function batchClaimRewards(
        uint256 _lotteryId, 
        uint256[] calldata _tokeIds
    ) 
        external 
        notContract()
    {
        require(
            _tokeIds.length <= 50,
            "Batch claim too large"
        );
        // Checking the lottery is in a valid time for claiming
        require(
            allLotteries_[_lotteryId].closingTimestamp <= getCurrentTime(),
            "Wait till end to claim"
        );
        // Checks the lottery winning numbers are available 
        require(
            allLotteries_[_lotteryId].lotteryStatus == Status.Completed,
            "Winning Numbers not chosen yet"
        );
        // Creates a storage for all winnings
        uint256 totalPrize = 0;
        // Loops through each submitted token
        for (uint256 i = 0; i < _tokeIds.length; i++) {
            // Checks user is owner (will revert entire call if not)
            require(
                nft_.getOwnerOfTicket(_tokeIds[i]) == msg.sender,
                "Only the owner can claim"
            );
            // If token has already been claimed, skip token
            if(
                nft_.getTicketClaimStatus(_tokeIds[i])
            ) {
                continue;
            }
            // Claims the ticket (will only revert if numbers invalid)
            require(
                nft_.claimTicket(_tokeIds[i], _lotteryId),
                "Numbers for ticket invalid"
            );
            // Boolean whether the winning number was matched
            uint8 matchingNumber = nft_.getTicketNumbers(_tokenIds[i]);
            bool matching = nft_.getTicketNumbers(_tokenIds[i]) == allLotteries_[_lotteryId].winningNumbers;
            // Getting the prize amount for those matching tickets
            uint256 prizeAmount = _prizeForMatching(
                                                    matching,
                                                    matchingNumber,
                                                    _lotteryId
                                                    );
            // Removing the prize amount from the pool
            allLotteries_[_lotteryId].prizePoolInCybar = allLotteries_[_lotteryId].prizePoolInCybar.sub(prizeAmount);
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
     * @param   _lotteryId: The ID of the lottery the user is claiming on
     * @return  uint256: The prize amount in cybar the user is entitled to 
     */
    function _prizeForMatching(
        bool _matching,
        uint8 _winningNumber,
        uint256 _lotteryId
    ) 
        internal  
        view
        returns(uint256) 
    {
        uint256 prize = 0;
        if(_matching == 0){
            return 0; 
        }
        uint256 prizePerTicket = allLotteries_[_lotteryId].prizePoolInCybar.div(allLotteries_[_lotteryId].ticketDistribution[_winningNumber]);
        return prizePerTicket;
    }

    function _cast(
        uint256 _randomNumber
    ) 
        internal
        view 
        returns(uint8) 
    {
        // Encodes the random number with its position in loop
        bytes32 hashOfRandom = keccak256(abi.encodePacked(_randomNumber, i));
        // Casts random number hash into uint256
        uint256 numberRepresentation = uint256(hashOfRandom);
        // Casting the uint256 to the desired interval
        uint8 winningNumber = uint8(numberRepresentation.mod(maxValidRange_));
        return winningNumber;
    }
}
