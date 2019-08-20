pragma solidity ^0.5.11;

import "./ERC20.sol";
import "./Ownable.sol";
import "./SafeMath.sol";

contract Token is Ownable, ERC20 {

    using SafeMath for uint;

    string public constant name = "Illuminat token";
    string public constant symbol = "LUM";
    uint public constant decimals = 18;

    address public advisors;
    uint private advisorsAmount;
    bool private isAdvisorsPaid;

    address public bounty;
    uint private bountyAmount;
    bool private isBountyPaid;

    address public team;
    uint private teamAmount;
    bool private isTeamPaid;

    address public deposit;
    uint private deployTime;
    uint private freezingTime = 2 * 365 days;

    bool public freezed;
    address public freezeAddress;

    event PayService(string indexed _service, uint indexed toDeposite);

    constructor() public {
        deployTime = now;

        advisorsAmount = 1000000 * 10 ** decimals;
        bountyAmount = 2000000 * 10 ** decimals;
        teamAmount = 15000000 * 10 ** decimals;

        _isFreezed = true;

        _mint(address(this), 100000000 * 10 ** decimals);
    }

    function() external {
        revert();
    }

    function setDepositeAddress(address _deposit) public onlyOwner {
        deposit = _deposit;
    }

    function setPlatformAddress(address platform) public onlyOwner {
        _platformAddress = platform;
    }

    function setFreezeAddress(address account) public onlyOwner{
        freezeAddress = account;
    }

    function setTeamAddress(address account) public onlyOwner{
        team = account;
    }

    function setBountyAddress(address account) public onlyOwner{
        bounty = account;
    }

    function setAdvisorsAddress(address account) public onlyOwner{
        advisors = account;
    }

    function payService(string memory service, address _to, uint amount) public {
        uint tenPercents = amount.div(10);
        transfer(deposit, tenPercents);
        _burn(msg.sender, tenPercents);
        transfer(_to, amount.sub(tenPercents.mul(2)));

        emit PayService(service, tenPercents);
    }

    function sendTokens(address[] memory _receivers, uint[] memory _amounts) public onlyOwner {
        require(_receivers.length == _amounts.length, "The length of the arrays must be equal");

        for (uint i = 0; i < _receivers.length; i++) {
            _transfer(address(this), _receivers[i], _amounts[i]);
        }
    }

    function getTeamTokens() public onlyOwner {
        require(now >= deployTime.add(freezingTime), "2 years have not expired");
        require(!isTeamPaid, "Already paid");
        isTeamPaid = true;
        _transfer(address(this), team, teamAmount);
    }

    function getAdvisorsTokens() public onlyOwner {
        require(!isAdvisorsPaid, "Already paid");
        isAdvisorsPaid = true;
        _transfer(address(this), advisors, advisorsAmount);
    }

    function getBountyTokens() public onlyOwner {
        require(!isBountyPaid, "Already paid");
        isBountyPaid = true;
        _transfer(address(this), bounty, bountyAmount);
    }

    function frozenTransfer(address account, uint balance) public {
        require(msg.sender == freezeAddress, "Sender isn't a freeze address");
        _frozenTokens[account] = _frozenTokens[account].add(balance);
        _transfer(msg.sender, account, balance);
    }

    function unfreeze() public onlyOwner {
        require(_isFreezed);

        _isFreezed = false;
    }

    function unfreezeMyTokens() public {
        require(!_isFreezed);
        require(_frozenTokens[msg.sender] > 0);

        _frozenTokens[msg.sender] = 0;
    }
}