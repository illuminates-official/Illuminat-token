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


contract('ps', function (accounts) {

    let tokenOwner = accounts[0];
    let psOwner = accounts[1];
    let depositOwner = accounts[5];
    let service = accounts[2];

    describe('Base payment service functionality', async () => {
        beforeEach('init', async () => {
            token = await TokenContract.new({from: tokenOwner});
            ps = await PSContract.new({from: psOwner});
            deposit = await DepositContract.new({from: depositOwner});
            await token.sendTokens([accounts[3]], [vs(100000)], {from: tokenOwner});
            await ps.setToken(token.address, {from: psOwner});
            await deposit.setPaymentServiceAddress(ps.address, {from: depositOwner});
            await token.setDepositAddress(deposit.address, {from: tokenOwner});
            await token.approve(ps.address, vs(100000), {from: accounts[3]});
        });

        it('replenishing of the balance', async () => {
            await ps.replenishBalance(vs(10000), {from: accounts[3]});

            assert.equal(+(await token.totalSupply()), vs(100000000));

            await ps.payService("test", service, vs(10), {from: accounts[3]});

            assert.equal(+(await token.totalSupply()), vs(99999999));
            assert.equal(+(await token.balanceOf(accounts[3])), vs(90000));
            assert.equal(+(await token.balanceOf(service)), vs(8));
            assert.equal(+(await deposit.paid(accounts[3])), vs(10));
        });

        it('withdrawal', async () => {
            await ps.replenishBalance(vs(10000), {from: accounts[3]});

            assert.equal(+(await ps.balance(accounts[3])), vs(10000));
            assert.equal(+(await token.balanceOf(accounts[3])), vs(90000));
            assert.equal(+(await token.balanceOf(ps.address)), vs(10000));

            await ps.withdraw(vs(100), {from: accounts[3]});

            assert.equal(+(await ps.balance(accounts[3])), vs(9900));
            assert.equal(+(await token.balanceOf(accounts[3])), vs(90100));
            assert.equal(+(await token.balanceOf(ps.address)), vs(9900));

            await ps.methods["withdraw()"]({from: accounts[3]});

            assert.equal(+(await ps.balance(accounts[3])), 0);
            assert.equal(+(await token.balanceOf(accounts[3])), vs(100000));
            assert.equal(+(await token.balanceOf(ps.address)), 0);
        });

        it('transfer on payment service contract', async () => {
            await ps.replenishBalance(vs(10000), {from: accounts[3]});

            assert.equal(+(await ps.balance(accounts[3])), vs(10000));
            assert.equal(+(await ps.balance(accounts[4])), 0);
            assert.equal(+(await token.balanceOf(accounts[3])), vs(90000));
            assert.equal(+(await token.balanceOf(ps.address)), vs(10000));

            await ps.transfer(accounts[4], vs(100), {from: accounts[3]});

            assert.equal(+(await ps.balance(accounts[3])), vs(9900));
            assert.equal(+(await ps.balance(accounts[4])), vs(100));
            assert.equal(+(await token.balanceOf(accounts[3])), vs(89900));
            assert.equal(+(await token.balanceOf(ps.address)), vs(10000));
        });
    });
});