pragma solidity ^0.5.11;

import "./IERC20.sol";
import "./SafeMath.sol";
import "./Ownable.sol";

contract StageFirst is Ownable {

    using SafeMath for uint;

    IERC20 public token;
    address payable public receiver;

    uint constant private duration = 15 days;
    uint private deployTime;
    uint private initTokens;

    mapping (address => uint) public investments;
    address payable[] public investors;
    address payable[] private _investors;
    uint public invested;
    uint public cap;

    event Investment(address indexed sender, uint indexed value);

    modifier capNotReached() {
        require(invested < cap, "Cap already reached");
        _;
    }

    modifier fundraisingTimeOut() {
        require(now >= deployTime.add(duration), "Investing are still ongoing");
        _;
    }

    modifier inTime() {
        require(now < deployTime.add(duration.mul(2)), "Investing time is up");
        _;
    }

    constructor() public {
        receiver = msg.sender;
        deployTime = now;

        cap = 225 ether;

        initTokens = 675000 * 10**18;
    }

    function() external payable {
        invest();
    }

    function invest() private inTime capNotReached {
        require(msg.value >= 100 finney, "Investment must be equal or greater than 0.1 ether");
        uint value;
        if(invested.add(msg.value) > cap) {
            value = cap.sub(invested);
            msg.sender.transfer(msg.value.sub(value));
        } else value = msg.value;

        if(investments[msg.sender] <= 0 && now < deployTime.add(duration)){
            _investors.push(msg.sender);
            investors.push(msg.sender);
        }

        investments[msg.sender] = investments[msg.sender].add(value);
        invested = invested.add(value);
        emit Investment(msg.sender, value);

        if(now > deployTime.add(duration)){
            _sendEther(receiver, value);
            _transfer(msg.sender, tokensAmount(value));
        }
    }

    function close() public onlyOwner fundraisingTimeOut {
        if (invested < 50 ether) {
            if (address(this).balance > 0) returnEther();
        } else {
            if (address(this).balance > 0) receiveEther();
            if (balance() > 0) sendTokens();
        }
        if (now >= deployTime.add(duration.mul(2)) && _investors.length == 0) {
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
        uint req = 40;
        if (_investors.length < req) req = _investors.length - 1;
        if (_investors.length == 1) {
            _transfer(_investors[0], tokensAmount(investments[_investors[0]]));
            return;
        }
        for (uint i = 0; i < req ; i++) {
            _transfer(_investors[0], tokensAmount(investments[_investors[0]]));
            _investors[0] = _investors[_investors.length - 1];
            _investors.pop();
        }
    }

    function returnEther() private {
        uint req = 40;
        if(_investors.length < req) req = _investors.length - 1;
        if (_investors.length == 1) {
            _sendEther(_investors[0], investments[_investors[0]]);
            return;
        }
        for (uint i = 0; i < req ; i++) {
            _sendEther(_investors[0], investments[_investors[0]]);
            _investors[0] = _investors[_investors.length - 1];
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
        return initTokens.mul(value).div(cap);
    }
}