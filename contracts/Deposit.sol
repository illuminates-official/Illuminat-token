pragma solidity ^0.5.11;

import "./IToken.sol";
import "./SafeMath.sol";
import "./Ownable.sol";

contract Deposit is Ownable {
    using SafeMath for uint256;

    IToken public token;

    mapping(address => uint) public paid;
    mapping(address => uint) public balance;

    constructor() public {

    }

    function() external {
        revert();
    }

    function setToken(address _token) public onlyOwner {
        token = IToken(_token);
    }

    function _serviceTransfer(address to, uint amount) public onlyOwner {
        _transfer(to, amount);
    }

    function transfer(address to, uint amount) public {
        balance[msg.sender] = balance[msg.sender].sub(amount);
        balance[to] = balance[to].add(amount);
        token.transferFrom(msg.sender, to, amount);
    }

    function replenishBalance(uint amount) public {
        balance[msg.sender] = balance[msg.sender].add(amount);
        token.transferFrom(msg.sender, address(this), amount);
    }

    function withdraw() public {
        uint _balance = balance[msg.sender];
        balance[msg.sender] = 0;
        _transfer(msg.sender, _balance);
    }

    function withdraw(uint amount) public {
        balance[msg.sender] = balance[msg.sender].sub(amount);
        _transfer(msg.sender, amount);
    }

    function payService(string memory service, address _to, uint amount) public {
        paid[msg.sender] = paid[msg.sender].add(amount);
        token.payService(service, _to, amount);
    }

    function _transfer(address to, uint amount) private {
        token.transfer(to, amount);
    }



}
