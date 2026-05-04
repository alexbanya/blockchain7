import { network } from "hardhat";

const { viem } = await network.getOrCreate({
  network: "opSepolia",
  chainType: "op",
});

const [owner1, owner2] = await viem.getWalletClients();

const owners = [
  owner1.account.address,
  owner2.account.address,
];

const numConfirmationsRequired = 2n;

const multiSig = await viem.deployContract("MultiSigWallet", [
  owners,
  numConfirmationsRequired,
]);

console.log(`MultiSigWallet deployed to: ${multiSig.address}`);
console.log(`Owner 1: ${owner1.account.address}`);
console.log(`Owner 2: ${owner2.account.address}`);
console.log(`Confirmations required: ${numConfirmationsRequired}`);