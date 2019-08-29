const TokenContract = artifacts.require("./Token.sol");
const StageFirstContract = artifacts.require("./StageFirst.sol");


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


contract('StageFirst', function (accounts) {

    let tokenOwner = accounts[0];
    let investOwner = accounts[1];
    let receiver = investOwner;
    let advisors = accounts[9];
    let bounty = accounts[0];
    let team = accounts[7];

    let firstStageBalance = vs(675000);

    let fduration = 3*day;
    let sduration = 14*day;

    let bal1, bal2, balc1, balc2;

    describe('Referal', async () => {
        beforeEach('init', async () => {
            token = await TokenContract.new({from: tokenOwner});
            first = await StageFirstContract.new({from: investOwner});
            await token.sendTokens([first.address], [vs(1000000)], {from: tokenOwner});
            await first.setToken(token.address, {from: investOwner});
        });

        it('invest with referer', async () => {
            await web3.eth.sendTransaction({from: accounts[3], to: first.address, gas: 150000, value: 100});
            await web3.eth.sendTransaction({from: accounts[2], to: first.address, gas: 150000, value: 100, data: accounts[3]});

            assert.equal(+(await first.investments(accounts[3])), 100);
            assert.equal(+(await first.investments(accounts[2])), 100);
            assert.equal(await first.investors(0), accounts[3]);
            assert.equal(await first.investors(1), accounts[2]);
            assert.equal(+(await first.totalInvested()), 200);
            assert.equal(await first.refererOf(accounts[2]), accounts[3]);


        });


    });
 });