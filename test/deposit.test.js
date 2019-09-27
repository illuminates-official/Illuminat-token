const TokenContract = artifacts.require("./Token.sol");
const PSContract = artifacts.require("./PaymentService.sol");
const DepositContract = artifacts.require("./Deposit.sol");


const increaseTime = function (duration) {
    const id = Date.now();
    return new Promise((resolve, reject) => {
        web3.currentProvider.send({
            jsonrpc: '2.0',
            method: 'evm_increaseTime',
            params: [duration],
            id: id,
        }, err1 => {
            if (err1) return reject(err1);

            web3.currentProvider.send({
                jsonrpc: '2.0',
                method: 'evm_mine',
                id: id + 1,
            }, (err2, res) => {
                return err2 ? reject(err2) : resolve(res);
            });
        });
    });
};

const hour = 3600;
const day = hour * 24;
const decimals = 10**18;

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
            await deposit.setToken(token.address, {from: depositOwner});
            await deposit.setPaymentService(ps.address, {from: depositOwner});
            await token.setDepositAddress(deposit.address, {from: tokenOwner});

            await token.sendTokens([accounts[4]], [vs(100000)], {from: tokenOwner});
            await token.sendTokens([accounts[5]], [vs(100000)], {from: tokenOwner});

            await token.approve(ps.address, vs(100000), {from: accounts[4]});
            await token.approve(ps.address, vs(100000), {from: accounts[5]});

            await ps.replenishBalance(vs(10000), {from: accounts[4]});
            await ps.replenishBalance(vs(10000), {from: accounts[5]});
        });

        it('distribution', async () => {
            await ps.hold(vs(100), {from: accounts[4]});
            await ps.hold(vs(100), {from: accounts[5]});

            assert.equal(+(await token.balanceOf(accounts[4])), vs(90000));
            assert.equal(+(await token.balanceOf(accounts[5])), vs(90000));

            await ps.payService("test", service, vs(100), {from: accounts[4]});

            await increaseTime(30*day);

            await deposit.distribute();

            assert.equal(+(await token.balanceOf(accounts[4])), vs(90005));
            assert.equal(+(await token.balanceOf(accounts[5])), vs(90005));
        });

        it('distribution, few holds, one valid', async () => {
            await ps.hold(vs(100), {from: accounts[4]});
            await ps.hold(vs(100), {from: accounts[5]});

            assert.equal(+(await token.balanceOf(accounts[4])), vs(90000));
            assert.equal(+(await token.balanceOf(accounts[5])), vs(90000));

            await ps.payService("test", service, vs(100), {from: accounts[4]});

            await increaseTime(30*day);
            
            await ps.hold(vs(200), {from: accounts[4]});
            await ps.hold(vs(300), {from: accounts[5]});

            await deposit.distribute();

            assert.equal(+(await token.balanceOf(accounts[4])), vs(90005));
            assert.equal(+(await token.balanceOf(accounts[5])), vs(90005));
        });

    });
});