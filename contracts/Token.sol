pragma solidity ^0.5.10;

import "./ERC20Burnable.sol";
import "./Ownable.sol";
import "./SafeMath.sol";

contract Token is ERC20Burnable, Ownable {

    using SafeMath for uint;

    string public constant name = "Illuminat token";
    string public constant symbol = "LUM";
    uint public constant decimals = 18;

    address private advisors;
    uint private advisorsAmount;

    address private bounty;
    uint private bountyAmount;

    address private team;
    uint private teamAmount;
    bool private isTeamPaid;

    address private deposit;
    uint private deployTime;
    uint private freezingTime = 2 * 365 days;

    event PayService(string indexed _service, uint indexed toDeposite);

    constructor(address a, address b, address t) public {
        deployTime = now;

        advisorsAmount = 1000000 * 10 ** decimals;
        bountyAmount = 2000000 * 10 ** decimals;
        teamAmount = 15000000 * 10 ** decimals;

        advisors = a;
        bounty = b;
        team = t;

        _mint(address(this), 100000000 * 10 ** decimals);
        _transfer(address(this), advisors, advisorsAmount);
        _transfer(address(this), bounty, bountyAmount);
    }

    function() external {
        revert();
    }

    function setDepositeAddress(address _deposit) public onlyOwner {
        deposit = _deposit;
    }

    function payService(string memory service, address _to, uint amount) public {
        uint tenPercents = amount.div(10);
        transfer(deposit, tenPercents);
        burn(tenPercents);
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
}