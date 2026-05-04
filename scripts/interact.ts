import { network } from "hardhat";
import { parseEther } from "viem";

const { viem } = await network.getOrCreate({
  network: "opSepolia",
  chainType: "op",
});

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const MULTISIG_ADDRESS = "0x3951faf9770e36c9fc60d5a4bec8fbb8f743ecd4";
const [owner1, owner2] = await viem.getWalletClients();

const multiSig = await viem.getContractAt(
  "MultiSigWallet",
  MULTISIG_ADDRESS as `0x${string}`
);

// 1. Fund the wallet
const fundTx = await owner1.sendTransaction({
  to: MULTISIG_ADDRESS as `0x${string}`,
  value: parseEther("0.001"),
});
console.log(`Funded wallet, tx: ${fundTx}`);
await sleep(3000);

// 2. Submit a transaction
await multiSig.write.submitTransaction(
  [owner2.account.address, parseEther("0.0005"), "0x"],
  { account: owner1.account }
);
console.log(`Transaction submitted`);
await sleep(3000);

// 3. Owner1 confirms
await multiSig.write.confirmTransaction([0n], { account: owner1.account });
console.log(`Owner1 confirmed`);
await sleep(3000);

// 4. Owner2 confirms
await multiSig.write.confirmTransaction([0n], { account: owner2.account });
console.log(`Owner2 confirmed`);
await sleep(3000);

// 5. Execute
await multiSig.write.executeTransaction([0n], { account: owner1.account });
console.log(`Transaction executed successfully`);
await sleep(2000);

// 6. Check tx status
const tx = await multiSig.read.getTransaction([0n]);
console.log(`Transaction executed: ${tx[3]}`);