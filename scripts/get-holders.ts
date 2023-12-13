import hre from "hardhat";
import { formatEther, parseAbi, parseAbiItem } from "viem";
// ERC-20 Token ABI
const tokenAbi = [
  "function balanceOf(address owner) view returns (uint256)",
  "event Transfer(address indexed _from, address indexed _to, uint256 _amount)",
];

async function getAddresses(
  contractAddress: `0x${string}`,
  creationBlock: bigint
) {
  const publicClient = await hre.viem.getPublicClient();

  const logs = await publicClient.getContractEvents({
    address: contractAddress,
    abi: parseAbi(tokenAbi),
    eventName: "Transfer",
    fromBlock: creationBlock,
  });

  const balances: Map<`0x${string}`, bigint> = new Map();

  console.error(`Found ${logs.length} transfer events`);

  for (const log of logs) {
    const user = (log.args as { _to: `0x${string}` })._to;
    balances.set(user, 0n);
  }

  console.error(`Found ${balances.size} unique addresses`);

  const users = Array.from(balances.keys());
  const abi = [parseAbiItem(tokenAbi[0])];

  const chunkSize = 50;
  for (let i = 0; i < users.length; i += chunkSize) {
    const chunk = users.slice(i, i + chunkSize);
    const results = await publicClient.multicall({
      contracts: chunk.map((address) => ({
        address: contractAddress,
        abi,
        functionName: "balanceOf",
        args: [address],
      })),
    });

    // Process results here
    for (const [j, user] of chunk.entries()) {
      const result = results[j];
      if (result.status === "failure") {
        throw new Error(`Failed to fetch balance for ${user}`);
      }
      balances.set(user, BigInt(result.result as bigint));
    }
    console.error(`Fetched balances for ${i + chunkSize} users`);
  }

  const positiveBalances: Map<`0x${string}`, bigint> = new Map(
    [...balances.entries()]
        .filter((entry) => entry[1] > 0n)
        .sort((a: [`0x${string}`, bigint], b: [`0x${string}`, bigint]) => Number(b[1] - a[1]))
  );
  return positiveBalances;
}

async function getCSVTable(inputMap: Map<`0x${string}`, bigint>): Promise<string> {
  let csvTable = "Address,Amount,Is Contract\n";
    const publicClient = await hre.viem.getPublicClient();

  for (const [key, value] of inputMap.entries()) {
    const isContract = !!await publicClient.getBytecode({
        address: key,
    });
    csvTable += `${key},${formatEther(value)},${isContract ? 'Yes' : 'No'}\n`;
  }
  return csvTable;
}

async function main() {
  const contractAddress = "0x5df8339c5e282ee48c0c7ce8a7d01a73d38b3b27";
  const creationBlock = 20086944n;

  const holders = await getAddresses(contractAddress, creationBlock);
  console.log(await getCSVTable(holders));
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
