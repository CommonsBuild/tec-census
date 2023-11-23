import { ethers } from "hardhat";
import { Filter, Log, formatEther } from "ethers"

const erc20Abi = [
  "event Transfer(address indexed from, address indexed to, uint256 value)",
];

async function fetchTransferEvents(contractAddress: string, fromBlock: number) {
  const contract = new ethers.Contract(contractAddress, erc20Abi);
  const filter = await contract.filters.Transfer(null, null, null).getTopicFilter();
  const eventFilter: Filter = { address: contractAddress, topics: filter, fromBlock, toBlock: 'latest'}
  return ethers.provider.getLogs(eventFilter)
}

async function getTokenHolders(contractAddress: string, creationBlock: number) {
  const events = await fetchTransferEvents(contractAddress, creationBlock);
  const balances: Map<string, bigint> = new Map();
  const iface = new ethers.Interface(erc20Abi)

  events.forEach((log: Log) => {
    const event = iface.parseLog({
      topics: [...log.topics],
      data: log.data,
    })!;
    const from = event.args.from;
    const to = event.args.to;
    const value = event.args.value;

    // Decrease the balance of the sender
    if (from !== "0x0000000000000000000000000000000000000000") {
      balances.set(from, BigInt(balances.get(from) || 0) - BigInt(value));
    }

    // Increase the balance of the recipient
    balances.set(to, BigInt(balances.get(to) || 0) + BigInt(value));
  });

  // Filter out addresses with zero balances
  const positiveBalances: Map<string, bigint> = new Map([...balances.entries()].filter(entry => entry[1] > 0));

  return positiveBalances;
}

async function getCSVTable(inputMap: Map<string, bigint>): string {

    const codes = await Promise.all([...inputMap.keys()].map(address => ethers.provider.getCode(address)));
    let markdownTable = "Address,Amount,Is Contract\n";

    let i = 0;
    inputMap.forEach((value, key) => {
        const isContract = codes[i++] == '0x' ? 'No': 'Yes';
        markdownTable += `${key},${formatEther(value)},${isContract}\n`;
    });

    return markdownTable;
}


async function main() {
  const contractAddress = "0x5df8339c5e282ee48c0c7ce8a7d01a73d38b3b27";
  const creationBlock = 20086944;

  const holders = await getTokenHolders(contractAddress, creationBlock);
  console.log(await getCSVTable(holders));
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
