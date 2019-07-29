pragma solidity ^0.5.10;

import "./ERC20.sol";

contract ERC20Burnable is ERC20 {

    function burn(uint256 amount) public {
        _burn(msg.sender, amount);
    }

    function burnFrom(address account, uint256 amount) public {
        _burnFrom(account, amount);
    }
}