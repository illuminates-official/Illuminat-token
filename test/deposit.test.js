const TokenContract = artifacts.require("./Token.sol");
const PSContract = artifacts.require("./PaymentService.sol");
const DepositContract = artifacts.require("./Deposit.sol");

function v(value){
    return (value * decimals).toString();
}

function dec(decimals){
    return '0'.repeat(decimals);
}

function vs(value){
    return (value.toString() + dec(18));
}


contract('Deposit', function (accounts) {

    let tokenOwner = accounts[0];
    let psOwner = accounts[1];
    let depositOwner = accounts[3];
    let service = accounts[2];

    describe('Base deposit functionality', async () => {
        beforeEach('init', async () => {
            token = await TokenContract.new({from: tokenOwner});
            ps = await PSContract.new({from: psOwner});
            deposit = await DepositContract.new({from: depositOwner});
            await ps.setToken(token.address, {from: psOwner});
            await deposit.setPaymentService(ps.address, {from: depositOwner});
            await token.setDepositAddress(deposit.address, {from: tokenOwner});

            await token.sendTokens([accounts[4]], [vs(100000)], {from: tokenOwner});
            await token.sendTokens([accounts[5]], [vs(100000)], {from: tokenOwner});

            await token.approve(ps.address, vs(100000), {from: accounts[4]});
            await token.approve(ps.address, vs(100000), {from: accounts[5]});

            await ps.replenishBalance(vs(10000), {from: accounts[4]});
            await ps.replenishBalance(vs(10000), {from: accounts[5]});
        });

        it('', async () => {
            
        });

    });
});