import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox-viem";

const config: HardhatUserConfig = {
  solidity: "0.8.19",
  networks: {
    hardhat: {
      chainId: 100,
      forking: {
        url: 'https://rpc.gnosischain.com',
        // url: 'https://gnosischain-archival.gateway.pokt.network/v1/lb/a72e33da3c8dfc0979c6acc8',
        blockNumber: 31413001,
      },
    },
    gnosis: {
      chainId: 100,
      url: 'https://rpc.gnosischain.com',
      timeout: 0,
    }
  },
}

export default config;
