pragma solidity ^0.5.11;

interface IPaymentService {

    function balanceOf(address account) external view returns (uint);
    function heldBalanceOf(address _account) external view returns(uint);
    function unHeldBalanceOf(address _account) external view returns(uint);

    function currentHolders(uint index) external view returns(address);
    function currentHoldersCount() external view returns(uint);
    function getHolderIndex(address account) external view returns(uint);

    function heldBalancesTimesCountOf(address account) external view returns(uint);
    function heldBalanceByTime(address account, uint time) external view returns(uint);
    function heldBalanceByTime(uint time) external view returns(uint);
    function heldBalancesTimesRecordOf(address account, uint index) external view returns(uint);

    function totalHeld() external view returns(uint);

    function transfer(address to, uint amount) external;

    function payService(string calldata service, address _to, uint amount) external;
}