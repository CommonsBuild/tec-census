import hre from "hardhat";
import { formatEther, parseAbi } from "viem";

const erc900Abi = [
  "event Staked(address indexed user, uint256 amount, uint256 total, bytes data)",
  "function totalStakedFor(address _addr) external view returns (uint256)",
];

async function getAddresses(
  contractAddress: `0x${string}`,
  creationBlock: bigint
) {
  const publicClient = await hre.viem.getPublicClient();

  const logs = await publicClient.getContractEvents({
    address: contractAddress,
    abi: parseAbi(erc900Abi),
    eventName: "Staked",
    fromBlock: creationBlock,
  });
  const balances: Map<`0x${string}`, bigint> = new Map();

  for (const log of logs) {
    const user = (log.args as { user: `0x${string}` }).user;
    balances.set(user, 0n);
  }

  const users = Array.from(balances.keys());

  // Process results here
  for (const user of users) {
    const result = await publicClient.readContract({
      address: contractAddress,
      abi: parseAbi(erc900Abi),
      functionName: "totalStakedFor",
      args: [user],
    });
    balances.set(user, BigInt(result as bigint));
  }

  const positiveBalances: Map<`0x${string}`, bigint> = new Map(
    [...balances.entries()].filter((entry) => entry[1] > 0n)
  );
  return positiveBalances;
}

async function getCSVTable(inputMap: Map<string, bigint>): Promise<string> {
  let csvTable = "Address,Amount\n";
  inputMap.forEach((value, key) => {
    csvTable += `${key},${formatEther(value)}\n`;
  });
  return csvTable;
}

async function main() {
  const contractAddress = "0xfDA4271CdFe69f8f8DF7f39B2248E775166ff632";
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
