import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: "0.8.19",
  mocha: {
    timeout: 0,
  },
  networks: {
    hardhat: {
      chainId: 100,
      forking: {
        url: 'https://rpc.gnosischain.com',
        // url: 'https://gnosischain-archival.gateway.pokt.network/v1/lb/a72e33da3c8dfc0979c6acc8',
        //blockNumber: 20086944+100,
      },
    },
  },
}

export default config;
