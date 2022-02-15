//SPDX-License-Identifier: MIT
pragma solidity 0.7.3;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./interfaces/IRussianRoulette.sol";
import "./Testable.sol";
// Safe math
import "@openzeppelin/contracts/math/SafeMath.sol";
import "./SafeMath16.sol";
import "./SafeMath8.sol";

contract RussianRouletteNFT is ERC1155, Ownable, Testable {
    // Libraries
    // Safe math
    using SafeMath for uint256;
    using SafeMath16 for uint16;
    using SafeMath8 for uint8;

    // State variables
    address internal russianRouletteContract_;

    uint256 internal totalSupply_;
    // Storage for ticket information
    struct TicketInfo {
        address owner;
        uint8 number;
        bool claimed;
        uint256 russianRouletteId;
    }
    // Token ID => Token information
    mapping(uint256 => TicketInfo) internal ticketInfo_;
    // User address => Russian Roulette ID => Ticket IDs
    mapping(address => mapping(uint256 => uint256[])) internal userTickets_;

    //-------------------------------------------------------------------------
    // EVENTS
    //-------------------------------------------------------------------------

    event InfoBatchMint(
        address indexed receiving,
        uint256 russianRouletteId,
        uint256 amountOfTokens,
        uint256[] tokenIds
    );

    //-------------------------------------------------------------------------
    // MODIFIERS
    //-------------------------------------------------------------------------

    /**
     * @notice  Restricts minting of new tokens to only the russian roulette contract.
     */
    modifier onlyRussianRoulette() {
        require(
            msg.sender == russianRouletteContract_,
            "Only Russian Roulette can mint"
        );
        _;
    }

    //-------------------------------------------------------------------------
    // CONSTRUCTOR
    //-------------------------------------------------------------------------

    /**
     * @param   _uri A dynamic URI that enables individuals to view information
     *          around their NFT token. To see the information replace the
     *          `\{id\}` substring with the actual token type ID. For more info
     *          visit:
     *          https://eips.ethereum.org/EIPS/eip-1155#metadata[defined in the EIP].
     * @param   _russianRoulette The address of the russian roulette contract. The
     *          russian roulette contract has elevated permissions on this contract.
     */
    constructor(
        string memory _uri,
        address _russianRoulette,
        address _timer
    ) ERC1155(_uri) Testable(_timer) {
        // Only russian roulette contract will be able to mint new tokens
        russianRouletteContract_ = _russianRoulette;
    }

    //-------------------------------------------------------------------------
    // VIEW FUNCTIONS
    //-------------------------------------------------------------------------

    function getTotalSupply() external view returns (uint256) {
        return totalSupply_;
    }

    /**
     * @param   _ticketId: The unique ID of the ticket
     * @return  uint8: The chosen number for that ticket
     */
    function getTicketNumber(uint256 _ticketId) external view returns (uint8) {
        return ticketInfo_[_ticketId].number;
    }

    /**
     * @param   _ticketId: The unique ID of the ticket
     * @return  address: Owner of ticket
     */
    function getOwnerOfTicket(uint256 _ticketId)
        external
        view
        returns (address)
    {
        return ticketInfo_[_ticketId].owner;
    }

    function getTicketClaimStatus(uint256 _ticketId)
        external
        view
        returns (bool)
    {
        return ticketInfo_[_ticketId].claimed;
    }

    function getUserTickets(uint256 _russianRouletteId, address _user)
        external
        view
        returns (uint256[] memory)
    {
        return userTickets_[_user][_russianRouletteId];
    }

    function getUserTicketsPagination(
        address _user,
        uint256 _russianRouletteId,
        uint256 cursor,
        uint256 size
    ) external view returns (uint256[] memory, uint256) {
        uint256 length = size;
        if (length > userTickets_[_user][_russianRouletteId].length - cursor) {
            length = userTickets_[_user][_russianRouletteId].length - cursor;
        }
        uint256[] memory values = new uint256[](length);
        for (uint256 i = 0; i < length; i++) {
            values[i] = userTickets_[_user][_russianRouletteId][cursor + i];
        }
        return (values, cursor + length);
    }

    //-------------------------------------------------------------------------
    // STATE MODIFYING FUNCTIONS
    //-------------------------------------------------------------------------

    /**
     * @param   _to The address being minted to
     * @param   _numberOfTickets The number of NFT's to mint
     * @param   _numbers The numbers for each game of russian roulette
     * @notice  Only the russian roulette contract is able to mint tokens.
     */
    function batchMint(
        address _to,
        uint256 _russianRouletteId,
        uint8 _numberOfTickets,
        uint8[] calldata _numbers
    ) external onlyRussianRoulette returns (uint256[] memory) {
        // Storage for the amount of tokens to mint (always 1)
        uint256[] memory amounts = new uint256[](_numberOfTickets);
        // Storage for the token IDs
        uint256[] memory tokenIds = new uint256[](_numberOfTickets);
        for (uint8 i = 0; i < _numberOfTickets; i++) {
            // Incrementing the tokenId counter
            totalSupply_ = totalSupply_.add(1);
            tokenIds[i] = totalSupply_;
            amounts[i] = 1;
            // Splitting out the chosen numbers
            uint8 number = _numbers[i];
            // Storing the ticket information
            ticketInfo_[totalSupply_] = TicketInfo(
                _to,
                number,
                false,
                _russianRouletteId
            );
            userTickets_[_to][_russianRouletteId].push(totalSupply_);
        }
        // Minting the batch of tokens
        _mintBatch(_to, tokenIds, amounts, msg.data);
        // Emitting relevant info
        emit InfoBatchMint(_to, _russianRouletteId, _numberOfTickets, tokenIds);
        // Returns the token IDs of minted tokens
        return tokenIds;
    }

    function claimTicket(uint256 _ticketId, uint256 _russianRouletteId)
        external
        onlyRussianRoulette
        returns (bool)
    {
        require(
            ticketInfo_[_ticketId].claimed == false,
            "Ticket already claimed"
        );
        require(
            ticketInfo_[_ticketId].russianRouletteId == _russianRouletteId,
            "Ticket not for this russian roulette game"
        );
        uint256 maxRange = IRussianRoulette(russianRouletteContract_)
            .getMaxRange();
        if (ticketInfo_[_ticketId].number > maxRange) {
            return false;
        }

        ticketInfo_[_ticketId].claimed = true;
        return true;
    }

    //-------------------------------------------------------------------------
    // INTERNAL FUNCTIONS
    //-------------------------------------------------------------------------
}
