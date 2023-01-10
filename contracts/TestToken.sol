// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

// Uncomment this line to use console.log
//import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TestToken is ERC20 {
    address public owner;

    constructor() ERC20("Test Token", "TTT") {
        owner = msg.sender;
    }

    modifier onlyBy(address _account) {
      require(
         msg.sender == _account,
         "Sender not authorized."
      );
      _;
   }

    function issueToken(uint _amount) public onlyBy(owner) {
        _mint(msg.sender, _amount * (10 ** 18));
    }
}