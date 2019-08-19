pragma solidity ^0.5.10;

import "./IERC20.sol";
import "./SafeMath.sol";
import "./Ownable.sol";

contract Bounty is Ownable {

    using SafeMath for uint;

    IERC20 public token;

    mapping (address => uint) public airdropBalances;
    mapping (address => bool) public airdropReceived;

    event AirdropTokensReceiving(address indexed _account, uint indexed _amount);
    event AirdropAccountAdded(address indexed _account, uint indexed _amount);

    constructor() public {

    }

    function() external {
        revert();
    }

    function setToken(address _token) public onlyOwner {
        token = IERC20(_token);
    }

    function addAirdropAccount(address _account, uint _balance) public onlyOwner {
        _addAirdropAccount(_account, _balance);
    }

    function addAirdropAccounts(address[] memory _account, uint[] memory _balance) public onlyOwner {
        require(_account.length == _balance.length, "The length of the arrays must be equal");

        for (uint i = 0; i < _account.length; i++) {
            _addAirdropAccount(_account[i], _balance[i]);
        }
    }

    function receiveTokens() public {
        require(!airdropReceived[msg.sender], "Airdrop tokens already received");
        uint amount = airdropBalances[msg.sender];
        airdropBalances[msg.sender] = 0;
        airdropReceived[msg.sender] = true;
        token.frozenTransfer(msg.sender, amount);
        emit AirdropTokensReceiving(msg.sender, amount);
    }

    function transfer(address to, uint amount) public onlyOwner {
        _transfer(to, amount);
    }

    function _transfer(address to, uint amount) private {
        token.transfer(to, amount);
    }

    function _addAirdropAccount(address _account, uint _amount) private {
        require(_account != address(0), "Account is zero address");
        require(airdropBalances[_account] == 0, "Airdrop balance already set");
        require(!airdropReceived[_account], "Airdrop tokens already received");
        airdropBalances[_account] = _amount;

        emit AirdropAccountAdded(_account, _amount);
    }

}