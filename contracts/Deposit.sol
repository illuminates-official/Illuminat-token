pragma solidity ^0.5.11;

import "./IToken.sol";
import "./IPaymentService.sol";
import "./SafeMath.sol";
import "./Ownable.sol";

contract Deposit is Ownable {
    using SafeMath for uint256;

    IToken public token;
    IPaymentService public paymentService;
    uint public lastDistribution;

    mapping(address => uint) public paid;

    event ServicePayment(address indexed _service, string indexed service, uint indexed _amount);

    constructor() public {
        lastDistribution = now;
    }

    function() external {
        revert();
    }

    function setToken(address _token) public onlyOwner {
        token = IToken(_token);
    }

    function setPaymentService(address _ps) public onlyOwner {
        paymentService = IPaymentService(_ps);
    }

    function _serviceTransfer(address to, uint amount) public onlyOwner {
        _transfer(to, amount);
    }

    function payService(string memory service, address _to, uint amount) public {
        require(msg.sender == paymentServiceAddress, "Sender is not payment service");
        paid[msg.sender] = paid[msg.sender].add(amount);
        emit ServicePayment(_to, service, amount);
    }

    function heldBalanceOf(address _account) public {
        paymentService.heldBalanceOf(_account);
    }

    function _transfer(address to, uint amount) private {
        token.transfer(to, amount);
    }
}
