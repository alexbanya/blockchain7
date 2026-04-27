import { network } from "hardhat";

const { viem } = await network.getOrCreate({
  network: "opSepolia",
  chainType: "op",
});

const PROXY_ADDRESS = "0x962e724caed85b156131d1827235e873649bde6d";

const [walletClient] = await viem.getWalletClients();

// 1. Deploy V2 implementation
const v2Impl = await viem.deployContract("MyTokenV2", []);
console.log(`V2 Implementation: ${v2Impl.address}`);

// 2. Connect to proxy as V1
const proxyV1 = await viem.getContractAt("MyTokenV1", PROXY_ADDRESS as `0x${string}`);

// 3. Check balance BEFORE upgrade
const balanceBefore = await proxyV1.read.balanceOf([walletClient.account.address]);
console.log(`Balance before upgrade: ${balanceBefore}`);

// 4. Execute upgrade
const tx = await proxyV1.write.upgradeToAndCall([v2Impl.address, "0x"]);
console.log(`Upgrade tx: ${tx}`);

// 5. Connect to same proxy address as V2
const proxyV2 = await viem.getContractAt("MyTokenV2", PROXY_ADDRESS as `0x${string}`);

// 6. Check balance AFTER upgrade (must match)
const balanceAfter = await proxyV2.read.balanceOf([walletClient.account.address]);
console.log(`Balance after upgrade: ${balanceAfter}`);

// 7. Call version() through proxy to verify upgrade
const ver = await proxyV2.read.version();
console.log(`version() returns: ${ver}`);