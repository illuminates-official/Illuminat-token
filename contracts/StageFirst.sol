pragma solidity ^0.5.11;

import "./IERC20.sol";
import "./SafeMath.sol";
import "./Ownable.sol";

contract StageFirst is Ownable {

    using SafeMath for uint;

    IERC20 public token;
    address payable public receiver;

    uint constant private firstDuration = 15 days;
    uint constant private secondDuration = 15 days;
    uint private deployTime;
    uint private initTokens;
    uint private currentBalance;

    mapping (address => uint) public investments;
    address payable[] public investors;
    address payable[] private _investors;
    uint public totalInvested;
    uint private currentInvested;
    uint public totalCap;
    uint private currentCap;

    event Investment(address indexed sender, uint indexed value);

    modifier capReached() {
        require(totalInvested == totalCap, "Cap not reached yet");
        _;
    }

    modifier capNotReached() {
        require(totalInvested < totalCap, "Cap already reached");
        _;
    }

    modifier fundraisingTimeOut() {
        require(now >= deployTime.add(firstDuration), "Investing are still ongoing");
        _;
    }

    modifier timeOut() {
        require(now >= deployTime.add(firstDuration.add(secondDuration)), "Investing are still ongoing");
        _;
    }

    modifier inTime() {
        require(now < deployTime.add(firstDuration.add(secondDuration)), "Investing time is up");
        _;
    }

    constructor() public {
        receiver = msg.sender;
        deployTime = now;

        totalCap = 225 ether;
        currentCap = totalCap;

        initTokens = 675000 * 10**18;
        currentBalance = initTokens;
    }

    function() external payable {
        invest();
    }

    function invest() private inTime capNotReached {
        require(msg.value >= 100 finney, "Investment must be equal or greater than 0.1 ether");
        uint value;
        if(totalInvested + msg.value > totalCap) {
            value = totalCap.sub(totalInvested);
            msg.sender.transfer(msg.value.sub(value));
        } else value = msg.value;

        if(investments[msg.sender] <= 0 && now < deployTime.add(firstDuration)){
            _investors.push(msg.sender);
            investors.push(msg.sender);
        }

        investments[msg.sender] = investments[msg.sender].add(value);
        totalInvested = totalInvested.add(value);
        currentInvested = currentInvested.add(value);
        emit Investment(msg.sender, value);

        if(now > deployTime.add(firstDuration)){
            _sendEther(receiver, value);
            _transfer(msg.sender, tokensAmount(value));
        }
    }

    function close() public onlyOwner fundraisingTimeOut {
        if (totalInvested < 50 ether) {
            if (address(this).balance > 0) returnEther();
        } else {
            if (address(this).balance > 0) receiveEther();
            if (balance() > 0) sendTokens();
        }
        if (now >= deployTime.add(firstDuration.add(secondDuration)) && _investors.length == 0) {
            if (balance() > 0) _transfer(address(token), balance());
        }
    }

    function setToken(address _token) public onlyOwner {
        token = IERC20(_token);
    }

    function transfer(address to, uint amount) public onlyOwner {
        _transfer(to, amount);
    }

    function sendTokens() private {
        int req = -1;
        int len = int(_investors.length);
        if (len > 5) req = len - 5;
        for (int i = len - 1; i > req; i--) {
            _transfer(_investors[uint(i)], tokensAmount(investments[_investors[uint(i)]]));
            _investors.pop();
        }
    }

    function returnEther() private {
        int req = -1;
        int len = int(_investors.length);
        if (len > 5) req = len - 5;
        for (int i = len - 1; i > req; i--) {
            _sendEther(_investors[uint(i)], investments[_investors[uint(i)]]);
            _investors.pop();
        }
    }

    function receiveEther() private {
        _sendEther(receiver, address(this).balance);
    }

    function _sendEther(address payable _receiver, uint _value) private {
        _receiver.transfer(_value);
    }

    function _transfer(address to, uint amount) private {
        token.transfer(to, amount);
    }

    function balance() private view returns(uint){
        return token.balanceOf(address(this));
    }

    function tokensAmount(uint value) public view returns(uint) {
        return currentBalance.mul(value).div(currentCap);
    }
}