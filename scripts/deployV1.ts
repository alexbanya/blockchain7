import { network } from "hardhat";
import { parseEther, encodeFunctionData } from "viem";

const { viem } = await network.getOrCreate({
  network: "opSepolia",
  chainType: "op",
});

const [walletClient] = await viem.getWalletClients();

// 1. Deploy V1 implementation
const v1Impl = await viem.deployContract("MyTokenV1", []);
console.log(`V1 Implementation: ${v1Impl.address}`);

// 2. Encode initialize call
const initData = encodeFunctionData({
  abi: v1Impl.abi,
  functionName: "initialize",
  args: [parseEther("1000000")],
});

// 3. Deploy proxy pointing to V1
const proxy = await viem.deployContract("MyProxy", [v1Impl.address, initData]);
console.log(`Proxy: ${proxy.address}`);

// 4. Connect to proxy as V1 and check balance
const tokenViaProxy = await viem.getContractAt("MyTokenV1", proxy.address);
const balance = await tokenViaProxy.read.balanceOf([walletClient.account.address]);
console.log(`Deployer balance via proxy: ${balance}`);

// 5. Mint some tokens via proxy
const mintTx = await tokenViaProxy.write.mint([walletClient.account.address, parseEther("5000")]);
console.log(`Mint tx: ${mintTx}`);

const balanceAfterMint = await tokenViaProxy.read.balanceOf([walletClient.account.address]);
console.log(`Balance after mint: ${balanceAfterMint}`);