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


contract('Token\n\ttoken.2\n', function (accounts) {

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

    describe('Sending tokens', async () => {
        beforeEach('init', async function () {
            token = await TokenContract.new({from: tokenOwner});
        });

        it('send team tokens', async () => {
            assert.equal(+(await token.balanceOf(team)), 0);
            assert.equal(+(await token.teamAmount()), vs(15000000));

            await token.sendTeamTokens(team, vs(1000000), {from: tokenOwner});

            assert.equal(+(await token.balanceOf(team)), vs(1000000));
            assert.equal(+(await token.teamAmount()), vs(14000000));
        });

        it('send advisors tokens', async () => {
            assert.equal(+(await token.balanceOf(advisors)), 0);
            assert.equal(+(await token.advisorsAmount()), vs(1000000));

            await token.sendAdvisorsTokens(advisors, vs(100000), {from: tokenOwner});

            assert.equal(+(await token.balanceOf(advisors)), vs(100000));
            assert.equal(+(await token.advisorsAmount()), vs(900000));
        });

        it('send bounty tokens', async () => {
            assert.equal(+(await token.balanceOf(bounty)), 0);
            assert.equal(+(await token.bountyAmount()), vs(2000000));

            await token.sendBountyTokens(bounty, vs(1000000), {from: tokenOwner});

            assert.equal(+(await token.balanceOf(bounty)), vs(1000000));
            assert.equal(+(await token.bountyAmount()), vs(1000000));
        });

        it('send bounty tokens (over amount)', async () => {
            assert.equal(+(await token.balanceOf(bounty)), 0);
            assert.equal(+(await token.bountyAmount()), vs(2000000));

            try {
                await token.sendBountyTokens(bounty, vs(2000001), {from: tokenOwner});
                throw "Fail!\n Exception must be thrown before";
            } catch (error) {assert(error.message.includes("Not enough tokens amount"));}

            assert.equal(+(await token.balanceOf(bounty)), 0);
            assert.equal(+(await token.bountyAmount()), vs(2000000));
        });

        it('send team tokens (over locked amount)', async () => {
            assert.equal(+(await token.balanceOf(team)), 0);
            assert.equal(+(await token.teamAmount()), vs(15000000));

            try {
                await token.sendTeamTokens(team, vs(5000001), {from: tokenOwner});
                throw "Fail!\n Exception must be thrown before";
            } catch (error) {assert(error.message.includes("Not enough unlocked tokens amount"));}

            assert.equal(+(await token.balanceOf(team)), 0);
            assert.equal(+(await token.teamAmount()), vs(15000000));
        });
        
        it('send advisors tokens (over locked amount)', async () => {
            assert.equal(+(await token.balanceOf(advisors)), 0);
            assert.equal(+(await token.advisorsAmount()), vs(1000000));

            try {
                await token.sendAdvisorsTokens(advisors, vs(350001), {from: tokenOwner});
                throw "Fail!\n Exception must be thrown before";
            } catch (error) {assert(error.message.includes("Not enough unlocked tokens amount"));}

            assert.equal(+(await token.balanceOf(advisors)), 0);
            assert.equal(+(await token.advisorsAmount()), vs(1000000));
        });

        it('send team tokens (over locked amount, after unlocking)', async () => {
            assert.equal(+(await token.balanceOf(team)), 0);
            assert.equal(+(await token.teamAmount()), vs(15000000));

            await increaseTime(2*365*day);

            await token.sendTeamTokens(team, vs(5000001), {from: tokenOwner});

            assert.equal(+(await token.balanceOf(team)), vs(5000001));
            assert.equal(+(await token.teamAmount()), vs(9999999));
        });
        
        it('send advisors tokens (over locked amount, after unlocking)', async () => {
            assert.equal(+(await token.balanceOf(advisors)), 0);
            assert.equal(+(await token.advisorsAmount()), vs(1000000));

            await increaseTime(2*365*day);

            await token.sendAdvisorsTokens(advisors, vs(350001), {from: tokenOwner});

            assert.equal(+(await token.balanceOf(advisors)), vs(350001));
            assert.equal(+(await token.advisorsAmount()), vs(649999));
        });

        it('send team tokens (over amount)', async () => {
            assert.equal(+(await token.balanceOf(team)), 0);
            assert.equal(+(await token.teamAmount()), vs(15000000));
            
            await increaseTime(2*365*day);

            try {
                await token.sendTeamTokens(team, vs(15000001), {from: tokenOwner});
                throw "Fail!\n Exception must be thrown before";
            } catch (error) {assert(error.message.includes("Not enough tokens amount"));}

            assert.equal(+(await token.balanceOf(team)), 0);
            assert.equal(+(await token.teamAmount()), vs(15000000));
        });
        
        it('send advisors tokens (over amount)', async () => {
            assert.equal(+(await token.balanceOf(advisors)), 0);
            assert.equal(+(await token.advisorsAmount()), vs(1000000));
            
            await increaseTime(2*365*day);

            try {
                await token.sendAdvisorsTokens(advisors, vs(1000001), {from: tokenOwner});
                throw "Fail!\n Exception must be thrown before";
            } catch (error) {assert(error.message.includes("Not enough tokens amount"));}

            assert.equal(+(await token.balanceOf(advisors)), 0);
            assert.equal(+(await token.advisorsAmount()), vs(1000000));
        });

        it('transfer tokens', async () => {
            assert.equal(+(await token.balanceOf(advisors)), 0);

            await token.transferTokens(advisors, vs(1000), {from: tokenOwner});

            assert.equal(+(await token.balanceOf(advisors)), vs(1000));
        });
        
        it('transfer tokens (not by owner)', async () => {
            assert.equal(+(await token.balanceOf(advisors)), 0);

            try {
                await token.transferTokens(advisors, vs(1000), {from: bounty});
                throw "Fail!\n Exception must be thrown before";
            } catch (error) {assert(error.message.includes("Ownable: caller is not the owner"));}

            assert.equal(+(await token.balanceOf(advisors)), 0);
        });
    });
});
