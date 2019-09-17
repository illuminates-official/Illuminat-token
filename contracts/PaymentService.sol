pragma solidity ^0.5.11;

import "./IToken.sol";
import "./IDeposit.sol";
import "./SafeMath.sol";
import "./Ownable.sol";

contract PaymentService is Ownable {
    using SafeMath for uint256;

    IToken public token;
    IDeposit public deposit;

    mapping(address => uint) public paid;
    mapping(address => uint) public balanceOf;
    mapping(address => uint) public heldBalanceOf;

    event Replenish(address indexed _account, uint indexed _amount);
    event Withdrawal(address indexed _account, uint indexed _amount);
    event DepositTransfer(address indexed _from, address indexed _to, uint indexed _amount);
    event ServicePayment(address indexed _payer, address indexed _service, uint indexed _amount);

    constructor() public {}

    function() external {
        revert();
    }

    function setToken(address _token) public onlyOwner {
        token = IToken(_token);
    }

    function setDeposit(address _deposit) public onlyOwner {
        deposit = IDeposit(_deposit);
    }

    function _serviceTransfer(address to, uint amount) public onlyOwner {
        _transfer(to, amount);
    }

    function transfer(address to, uint amount) public {
        balanceOf[msg.sender] = balanceOf[msg.sender].sub(amount);
        balanceOf[to] = balanceOf[to].add(amount);
        token.transferFrom(msg.sender, to, amount);
        emit DepositTransfer(msg.sender, to, amount);
    }

    function replenishBalance(uint amount) public {
        balanceOf[msg.sender] = balanceOf[msg.sender].add(amount);
        token.transferFrom(msg.sender, address(this), amount);
        emit Replenish(msg.sender, amount);
    }

    function withdraw() public {
        uint _balanceOf = balanceOf[msg.sender];
        balanceOf[msg.sender] = 0;
        _transfer(msg.sender, _balanceOf);
        emit Withdrawal(msg.sender, _balanceOf);
    }

    function withdraw(uint amount) public {
        balanceOf[msg.sender] = balanceOf[msg.sender].sub(amount);
        _transfer(msg.sender, amount);
        emit Withdrawal(msg.sender, amount);
    }

    function hold(uint amount) public {
        require(amount >= balanceOf[msg.sender], "Not enough balance on payment service contract");
        heldBalanceOf[msg.sender] = heldBalanceOf[msg.sender].add(amount);
    }

    function unHold(uint amount) public {
        require(amount <= heldBalanceOf[msg.sender], "Not enough held balance on payment service contract");
        heldBalanceOf[msg.sender] = heldBalanceOf[msg.sender].sub(amount);
    }

    function unHold() public {
        heldBalanceOf[msg.sender] = 0
    }

    function payService(string memory service, address _to, uint amount) public {
        balanceOf[msg.sender] = balanceOf[msg.sender].sub(amount);
        deposit.payService(service, _to, amount);
        token.payService(service, _to, amount);
        emit ServicePayment(msg.sender, _to, amount);
    }

    function _transfer(address to, uint amount) private {
        token.transfer(to, amount);
    }
}
