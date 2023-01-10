// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Coaster {
    enum Status {
        Active,
        Terminated
    }

    IERC20 public token;
    address public owner;
    address public guest;
    string public guestAlias;
    uint256 public debtsAmount;
    uint256 public debtsLimit;
    uint public created;
    Status public status;

    event DebtsAdded(
        string productName,
        uint256 productPrice,
        uint256 totalDebts,
        uint timestamp
    );
    event DebtsPayed(
        uint256 amount,
        uint256 remainingDebts,
        uint timestamp
    );
    event AllowanceRequest(
        address to,
        uint256 amount,
        uint timestamp
    );
    event DebtsCollected(
        uint256 seizedAmount,
        uint256 remainingDebts,
        uint timestamp
    );
    event Terminated(
        uint timestamp
    );

    constructor(address _token, address _guest, string memory _guestAlias, uint256 _debtsLimit) {
        require(
            msg.sender != address(0),
            "Invalid sender address."
        );
        require(
            _token != address(0),
            "Invalid token address."
        );
        require(
            _guest != address(0),
            "Invalid guest address."
        );
        require(
            bytes(_guestAlias).length > 0,
            "Invalid guest address."
        );
        require(
            _debtsLimit > 0,
            "Invalid debts limit."
        );

        owner = msg.sender;
        token = IERC20(_token);
        guest = _guest;
        guestAlias = _guestAlias;
        debtsLimit = _debtsLimit;
        status = Status.Active;
    }

    modifier onlyBy(address _account) {
        require(
            msg.sender == _account,
            "Sender not authorized."
        );
        _;
    }

    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }

    function addDebts(string memory _productName, uint256 _productPrice) external onlyBy(owner) {
        require(
            status == Status.Active,
            "Contract is not active."
        );
        require(
            bytes(_productName).length != 0,
            "Invalid product name."
        );
        require(
            _productPrice > 0,
            "Invalid product price."
        );
        require(
            debtsLimit >= debtsAmount + _productPrice,
            "Debts limit exceeded."
        );

        debtsAmount += _productPrice;

        emit DebtsAdded(
            _productName,
            _productPrice,
            debtsAmount,
            block.timestamp
        );
    }

    function payDebts() external payable onlyBy(guest) {
        require(
            status == Status.Active,
            "Contract is not active."
        );
        require(
            msg.value <= debtsAmount,
            "Invalid repayment amount."
        );

        debtsAmount -= msg.value;

        emit DebtsPayed(
            msg.value,
            debtsAmount,
            block.timestamp
        );

        terminate();
    }

    function collectDebts() external onlyBy(owner) {
        uint256 allowance = token.allowance(
            guest,
            address(this)
        );
        uint256 amount = allowance;

        if(allowance > 0) {
            if(allowance > debtsAmount) {
                amount = debtsAmount;
            }

            require(
                token.transferFrom(
                    guest,
                    address(this),
                    amount
                )
            );

            debtsAmount -= amount;
            
            emit DebtsCollected(
                amount,
                debtsAmount,
                block.timestamp
            );

            terminate();
        } else {
            emit AllowanceRequest(
                address(this),
                debtsAmount,
                block.timestamp
            );
        }
    }

    function terminate() internal {
        if(debtsAmount == 0) {
            status = Status.Terminated;
            emit Terminated(block.timestamp);
        }
    }

    function withdraw() external onlyBy(owner) {
        uint256 balance = token.balanceOf(address(this));
        token.transfer(owner, balance);
    }

    function dispose() public onlyBy(owner) {
        selfdestruct(payable(owner));
    }
}
