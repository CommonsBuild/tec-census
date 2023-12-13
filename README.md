# TEC Census

This project makes a CSV file of all TEC holders, their balances, and if they are a contract or not.

## Usage

```shell
npm install
npx hardhat run scripts/get-holders.ts > holders.csv
```

It also can be used for ERC900 contracts and the `get-stake-holders.ts` script.

```shell
npx hardhat run scripts/get-stake-holders.ts > stake-holders.csv
```
