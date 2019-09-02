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


contract('StageFirst\n\tstages.10\n', function (accounts) {

    let tokenOwner = accounts[0];
    let investOwner = accounts[1];
    let receiver = investOwner;
    let advisors = accounts[9];
    let bounty = accounts[0];
    let team = accounts[7];

    let firstStageBalance = vs(675000);

    let fduration = 15*day;
    let sduration = 15*day;

    let bal1, bal2, balc1, balc2, balc3;

    describe('Investing', async () => {
        beforeEach('init', async () => {
            token = await TokenContract.new({from: tokenOwner});
            first = await StageFirstContract.new({from: investOwner});
            await token.sendTokens([first.address], [firstStageBalance], {from: tokenOwner});
            await first.setToken(token.address, {from: investOwner});
        });

        it('investing after first duration', async () => {
            await increaseTime(fduration+1);

            await web3.eth.sendTransaction({from: accounts[2], to: first.address, gas: 170000, value: v(0.1)});

            assert.equal(+(await first.investments(accounts[2])), v(0.1));
            assert.equal(+(await first.invested()), v(0.1));
            assert.equal(await first.investors(0), accounts[2]);
            assert.equal(+(await token.balanceOf(accounts[2])), vs(300));
        });
    });

        describe('Limit number of accounts', async () => {
            beforeEach('init', async () => {
                token = await TokenContract.new({from: tokenOwner});
                first = await StageFirstContract.new({from: investOwner});
                await token.sendTokens([first.address], [firstStageBalance], {from: tokenOwner});
                await first.setToken(token.address, {from: investOwner});
            });

            it('returning ether', async () => {
                balc1 = await web3.eth.getBalance(first.address);

                await web3.eth.sendTransaction({from: accounts[2], to: first.address, gas: 170000, value: v(1)});
                await web3.eth.sendTransaction({from: accounts[3], to: first.address, gas: 170000, value: v(1)});
                await web3.eth.sendTransaction({from: accounts[4], to: first.address, gas: 170000, value: v(1)});
                await web3.eth.sendTransaction({from: accounts[5], to: first.address, gas: 170000, value: v(1)});
                await web3.eth.sendTransaction({from: accounts[6], to: first.address, gas: 170000, value: v(1)});
                await web3.eth.sendTransaction({from: accounts[7], to: first.address, gas: 170000, value: v(1)});

                assert.equal(await first.investors(0), accounts[2]);
                assert.equal(await first.investors(1), accounts[3]);
                assert.equal(await first.investors(2), accounts[4]);
                assert.equal(await first.investors(3), accounts[5]);
                assert.equal(await first.investors(4), accounts[6]);
                assert.equal(await first.investors(5), accounts[7]);
                assert.equal(+(await first.invested()), v(6));

                balc2 = await web3.eth.getBalance(first.address);
                
                await increaseTime(fduration+sduration+1);

                await first.close({from: investOwner});

                balc3 = await web3.eth.getBalance(first.address);

                assert.equal(balc1, 0);
                assert.equal(balc2, vs(6));
                assert.equal(balc3, vs(1));

                await first.close({from: investOwner});

                balc3 = await web3.eth.getBalance(first.address);

                assert.equal(balc3, 0);
        });

        it('sending tokens', async () => {
            balc1 = await web3.eth.getBalance(first.address);

            await web3.eth.sendTransaction({from: accounts[2], to: first.address, gas: 170000, value: v(40)});
            await web3.eth.sendTransaction({from: accounts[3], to: first.address, gas: 170000, value: v(40)});
            await web3.eth.sendTransaction({from: accounts[4], to: first.address, gas: 170000, value: v(40)});
            await web3.eth.sendTransaction({from: accounts[5], to: first.address, gas: 170000, value: v(40)});
            await web3.eth.sendTransaction({from: accounts[6], to: first.address, gas: 170000, value: v(40)});
            await web3.eth.sendTransaction({from: accounts[7], to: first.address, gas: 170000, value: v(25)});

            assert.equal(await first.investors(0), accounts[2]);
            assert.equal(await first.investors(1), accounts[3]);
            assert.equal(await first.investors(2), accounts[4]);
            assert.equal(await first.investors(3), accounts[5]);
            assert.equal(await first.investors(4), accounts[6]);
            assert.equal(await first.investors(5), accounts[7]);
            assert.equal(+(await first.invested()), vs(225));

            balc2 = await web3.eth.getBalance(first.address);
            
            await increaseTime(fduration+1);

            await first.close({from: investOwner});

            assert.equal(+(await token.balanceOf(accounts[2])), vs(120000));
            assert.equal(+(await token.balanceOf(accounts[3])), vs(120000));
            assert.equal(+(await token.balanceOf(accounts[4])), vs(120000));
            assert.equal(+(await token.balanceOf(accounts[5])), vs(120000));
            assert.equal(+(await token.balanceOf(accounts[6])), vs(120000));
            assert.equal(+(await token.balanceOf(accounts[7])), 0);

            balc3 = await web3.eth.getBalance(first.address);
            bal1 = await web3.eth.getBalance(receiver);

            assert.equal(balc1, 0);
            assert.equal(balc3, 0);

            await first.close({from: investOwner});

            bal1 = await web3.eth.getBalance(receiver);
            balc3 = await web3.eth.getBalance(first.address);

            assert.equal(+(await token.balanceOf(accounts[2])), vs(120000));
            assert.equal(+(await token.balanceOf(accounts[3])), vs(120000));
            assert.equal(+(await token.balanceOf(accounts[4])), vs(120000));
            assert.equal(+(await token.balanceOf(accounts[5])), vs(120000));
            assert.equal(+(await token.balanceOf(accounts[6])), vs(120000));
            assert.equal(+(await token.balanceOf(accounts[7])), vs(75000));

            assert.equal(balc3, 0);
        });

        // it('closing after sending tokens after first duration', async () => {
        //     balc1 = await web3.eth.getBalance(first.address);

        //     await web3.eth.sendTransaction({from: accounts[7], to: first.address, gas: 170000, value: v(40)});

        //     assert.equal(await first.investors(0), accounts[7]);
        //     assert.equal(+(await first.invested()), vs(40));

        //     balc2 = await web3.eth.getBalance(first.address);
            
        //     await increaseTime(fduration+1);

        //     balc3 = await web3.eth.getBalance(first.address);

        //     assert.equal(balc1, 0);
        //     assert.equal(balc2, vs(40));
        //     assert.equal(balc3, vs(40));

        //     await web3.eth.sendTransaction({from: accounts[8], to: first.address, gas: 170000, value: v(40)});
            
        //     assert.equal(+(await first.invested()), vs(80));

        //     await first.close({from: investOwner});

        //     assert.equal(await first.investors(0), accounts[7]);
        //     assert.equal(await first.investors(1), accounts[8]);
        //     assert.equal(+(await token.balanceOf(accounts[8])), vs(120000));
        //     assert.equal(+(await token.balanceOf(accounts[7])), vs(120000));

        //     balc3 = await web3.eth.getBalance(first.address);

        //     assert.equal(balc1, 0);
        //     assert.equal(balc3, 0);
        // });

        // it('closing after sending tokens after ether returning after first duration', async () => {
        //     balc1 = await web3.eth.getBalance(first.address);

        //     await web3.eth.sendTransaction({from: accounts[8], to: first.address, gas: 170000, value: v(20)});
        //     await web3.eth.sendTransaction({from: accounts[7], to: first.address, gas: 170000, value: v(20)});

        //     assert.equal(await first.investors(0), accounts[8]);
        //     assert.equal(await first.investors(1), accounts[7]);
        //     assert.equal(+(await first.invested()), vs(40));

        //     balc2 = await web3.eth.getBalance(first.address);
            
        //     await increaseTime(fduration+1);
        //     await first.close({from: investOwner});

        //     balc3 = await web3.eth.getBalance(first.address);

        //     assert.equal(balc1, 0);
        //     assert.equal(balc2, vs(40));
        //     assert.equal(balc3, 0);

        //     await web3.eth.sendTransaction({from: accounts[9], to: first.address, gas: 170000, value: v(40)});

        //     assert.equal(+(await first.invested()), vs(80));
        //     assert.equal(+(await token.balanceOf(accounts[7])), 0);
        //     assert.equal(+(await token.balanceOf(accounts[8])), 0);
        //     assert.equal(+(await token.balanceOf(accounts[9])), vs(120000));

        //     await first.close({from: investOwner});

        //     assert.equal(await first.investors(0), accounts[8]);
        //     assert.equal(await first.investors(1), accounts[7]);
        //     assert.equal(await first.investors(2), accounts[9]);
        //     assert.equal(+(await token.balanceOf(accounts[7])), 0);
        //     assert.equal(+(await token.balanceOf(accounts[8])), 0);
        //     assert.equal(+(await token.balanceOf(accounts[9])), vs(120000));

        //     balc3 = await web3.eth.getBalance(first.address);

        //     assert.equal(balc1, 0);
        //     assert.equal(balc3, 0);
        // });
    });
});