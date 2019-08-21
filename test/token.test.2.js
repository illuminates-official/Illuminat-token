const TokenContract = artifacts.require("./Token.sol");


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


contract('Token', function (accounts) {

    let tokenOwner = accounts[0];
    let advisors = accounts[4];
    let bounty = accounts[5];
    let team = accounts[6];
    let deposite = accounts[7];

    let zeroAddress = "0x0000000000000000000000000000000000000000";

    let ab = vs(1000000);
    let bb = vs(2000000);
    let tb = vs(15000000);
    let totalSupply = vs(100000000);

    let token;

    let recievers = [accounts[8], accounts[9]];
    let amounts = [vs(120), vs(230)];

    describe('Addresses and balances', async () => {
        beforeEach('init', async function () {
            token = await TokenContract.new({from: tokenOwner});
        });

        it('set bounty address', async function () {
            assert.equal(await token.bounty(), zeroAddress);

            await token.setBountyAddress(bounty, {from: tokenOwner});
            assert.equal(await token.bounty(), bounty);
            assert.equal(await token.freezeAddress(), bounty);
        });
        
        it('set bounty address (not by owner)', async function () {
            assert.equal(await token.bounty(), zeroAddress);

            try {
                await token.setBountyAddress(bounty, {from: advisors});
                throw "Fail!\n Exception must be thrown before";
            } catch (error) {assert(error.message.includes("revert"));}

            assert.equal(await token.bounty(), zeroAddress);
            assert.equal(await token.freezeAddress(), zeroAddress);
        });



    });
});
