# Lottery-Contract

---

## Repository setup

### Install

To install the needed packages run:

`yarn` or `npm install`

### Build

To build the smart contracts run:

`yarn build` or `npm run build`

### Test

To run the tests for the smart contracts run:

`yarn test` or `npm run test`

### Test coverage

For the test converge of the contracts run:

`yarn cover` or `npm run cover`

There are multiple mock contracts that have been created for testing purposes. These have been excluded from the coverage. For more information check the [.solcover.js](./.solcover.js).

### Deploy


To deploy a contracts locally, first run:

`npx hardhat node`

then:

- `yarn deploy_lottery_test:local` or `npm run deploy_lottery_test:local` for lottery
- `yarn deploy_russian_roulette_test:local` or `npm run deploy_russian_roulette_test:local` for russian roulette

Note that deploying the contracts locally does not require any inputs.
Finally, a table with adresses should be returned.

#### Shell Interaction
In order to interact with the contact via shell run:

`npx hardhat console --network localhost`

This starts the interactive Javascript console.

To obtain e.g. the lottery contract run:

`const Lottery = await ethers.getContractFactory('Lottery');`

`const lotterInstance = await Lottery.attach('<Deployed Lottery Address>')`

whereas **Deployed Lottery Address** can be obtained from the returned table after local deployment.

Then, one can invoke any methods such as e.g.

`await lottery.getMaxRange();`

The way to interact with the russian roulette contract is analogous.

**Resources**: https://docs.openzeppelin.com/learn/deploying-and-interacting

### Design Notes

The `Lottery` and `LotteryNFT` contracts both inherit from a contract called `Testable`. This contract allows for simple time manipulation for testing purposes. For a non-local deployment the address of this contract can simply be set to 0 in the constructor and the contracts will use the current `block.timestamp`.