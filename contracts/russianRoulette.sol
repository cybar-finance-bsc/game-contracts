// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.7.6;


contract ReentrancyGuard {
  bool private _notEntered;

  constructor(){
    _notEntered = true;
  }

  modifier noReeantrant {
    require(_notEntered, 'Guarded: reentrancy call!');
    _notEntered = false;
    _;
    _notEntered  =true;
  }
}


contract Lottery is ReentrancyGuard {
  uint256 public constant maximalPot = 5 ether;
  uint256 public constant minimalStake = 0.5 ether;
  uint256 private currentPot = 0 ether;
  uint256 private constant gamingPeriod = 4 hours;
  uint256 private endTime =0;

  uint256 private numberContestants =0;
  mapping(uint256 => address) private participants;
  mapping(address => uint256) private balances;
  address public winner;

  modifier rules {
    require(currentPot < maximalPot, 'Pot is filled. Game over');
    require(msg.value >= minimalStake, 'not enough ether!');
    _;
  }

  modifier isGameOver{
    require(currentPot >= maximalPot && block.timestamp <= endTime, 'Game is still going!');
    _;
  }

  modifier isWinner {
    require(msg.sender == winner, 'You are not the winner');
    _;
  }

  constructor() {
    endTime = block.timestamp + gamingPeriod;
  }

  function deposit() external payable rules noReeantrant {
    if(balances[msg.sender] ==0){
      participants[numberContestants] = msg.sender;
      ++numberContestants;
    }
    balances[msg.sender] += msg.value;
    currentPot += msg.value;
  }

  function random() internal view returns(uint256) {
    return uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender, address(this).balance))) % address(this).balance;
  }

  function declareWinner() external isGameOver {
    uint256 winningNumber = random();
    uint256 numbersChecked =0;
    for(uint256 i=0; i< numberContestants; ++i ){
      if(winningNumber < numbersChecked + balances[participants[i]] ){
        winner = participants[i];
        break;
      }
      numbersChecked += balances[participants[i]];
    }
  }


  function withdraw() external isGameOver isWinner {
    (bool sent, ) = msg.sender.call{ value: address(this).balance }('');
    require(sent, 'Transaction failure');
  }
}
