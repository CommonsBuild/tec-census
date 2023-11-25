import { ethers } from "hardhat";
import { Contract, formatEther, JsonRpcProvider } from "ethers"

const provider = new JsonRpcProvider("https://rpc.gnosischain.com");

const erc900Abi = [
  "event Staked(address indexed user, uint256 amount, uint256 total, bytes data)",
  "function totalStakedFor(address _addr) external view returns (uint256)"
];

async function fetchStakedEvents(contract: Contract, fromBlock: number) {
  const filter = await contract.filters.Staked().getTopicFilter();
  const logs = await contract.queryFilter(filter);
  return logs;
}

async function getAddresses(contractAddress: string, creationBlock: number) {
  const contract = new ethers.Contract(contractAddress, erc900Abi, provider);
  const logs = await fetchStakedEvents(contract, creationBlock);
  console.log(`Found ${logs.length} staked events`)
  const balances: Map<string, bigint> = new Map();

  for (const log of logs) {
    
    try {
      const parsedLog = contract.interface.parseLog({
        topics: [...log.topics],
        data: log.data,
      });
  
      if (parsedLog) {
        const [ user ] = parsedLog.args;
        // If we already have a balance for this user, skip
        if (!balances.has(user)) {
            // the following line throws the error "The method eth_accounts does not exist/is not available"
            const currentStake = await contract.totalStakedFor(user);
            balances.set(user, currentStake);
        }
      }
    } catch (error: any) {
      
    }
  }

  // Filter out addresses with zero balances
  const positiveBalances: Map<string, bigint> = new Map([...balances.entries()].filter(entry => entry[1] > 0));

  return positiveBalances;
}

async function getCSVTable(inputMap: Map<string, bigint>): Promise<string> {
    let markdownTable = "Address,Amount\n";
    inputMap.forEach((value, key) => {
        markdownTable += `${key},${formatEther(value)}\n`;
    });
    return markdownTable;
}


async function main() {
  const contractAddress = "0xfDA4271CdFe69f8f8DF7f39B2248E775166ff632";
  const creationBlock = 20086944;

  const holders = await getAddresses(contractAddress, creationBlock);
  console.log(await getCSVTable(holders));
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
