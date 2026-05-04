import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { network } from "hardhat";
import { parseEther } from "viem";

describe("MultiSigWallet", async function () {
  const { viem } = await network.create();
  const publicClient = await viem.getPublicClient();
  const [owner1, owner2, owner3, nonOwner] = await viem.getWalletClients();

  const owners = [
    owner1.account.address,
    owner2.account.address,
    owner3.account.address,
  ];

  async function deployFixture() {
    return await viem.deployContract("MultiSigWallet", [owners, 2]);
  }

  it("Should deploy with correct confirmations required", async function () {
    const multiSig = await deployFixture();
    const count = await multiSig.read.numConfirmationsRequired();
    assert.equal(count, 2n);
  });

  it("Should accept Ether deposits", async function () {
    const multiSig = await deployFixture();
    await owner1.sendTransaction({ to: multiSig.address, value: parseEther("1") });
    const balance = await publicClient.getBalance({ address: multiSig.address });
    assert.equal(balance, parseEther("1"));
  });

  it("Should allow owner to submit a transaction", async function () {
    const multiSig = await deployFixture();
    await multiSig.write.submitTransaction(
      [owner2.account.address, parseEther("0"), "0x"],
      { account: owner1.account }
    );
    const count = await multiSig.read.getTransactionCount();
    assert.equal(count, 1n);
  });

  it("Should not allow non-owner to submit a transaction", async function () {
    const multiSig = await deployFixture();
    let failed = false;
    try {
      await multiSig.write.submitTransaction(
        [owner2.account.address, parseEther("0"), "0x"],
        { account: nonOwner.account }
      );
    } catch { failed = true; }
    assert.equal(failed, true);
  });

  it("Should allow owners to confirm a transaction", async function () {
    const multiSig = await deployFixture();
    await multiSig.write.submitTransaction(
      [owner2.account.address, parseEther("0"), "0x"],
      { account: owner1.account }
    );
    await multiSig.write.confirmTransaction([0n], { account: owner1.account });
    const tx = await multiSig.read.getTransaction([0n]);
    assert.equal(tx[4], 1n);
  });

  it("Should not allow duplicate confirmations", async function () {
    const multiSig = await deployFixture();
    await multiSig.write.submitTransaction(
      [owner2.account.address, parseEther("0"), "0x"],
      { account: owner1.account }
    );
    await multiSig.write.confirmTransaction([0n], { account: owner1.account });
    let failed = false;
    try {
      await multiSig.write.confirmTransaction([0n], { account: owner1.account });
    } catch { failed = true; }
    assert.equal(failed, true);
  });

  it("Should allow owner to revoke confirmation", async function () {
    const multiSig = await deployFixture();
    await multiSig.write.submitTransaction(
      [owner2.account.address, parseEther("0"), "0x"],
      { account: owner1.account }
    );
    await multiSig.write.confirmTransaction([0n], { account: owner1.account });
    await multiSig.write.revokeConfirmation([0n], { account: owner1.account });
    const tx = await multiSig.read.getTransaction([0n]);
    assert.equal(tx[4], 0n);
  });

  it("Should execute transaction after enough confirmations", async function () {
    const multiSig = await deployFixture();
    await owner1.sendTransaction({ to: multiSig.address, value: parseEther("1") });
    const balanceBefore = await publicClient.getBalance({ address: owner3.account.address });
    await multiSig.write.submitTransaction(
      [owner3.account.address, parseEther("0.5"), "0x"],
      { account: owner1.account }
    );
    await multiSig.write.confirmTransaction([0n], { account: owner1.account });
    await multiSig.write.confirmTransaction([0n], { account: owner2.account });
    await multiSig.write.executeTransaction([0n], { account: owner1.account });
    const balanceAfter = await publicClient.getBalance({ address: owner3.account.address });
    assert.ok(balanceAfter > balanceBefore);
  });

  it("Should not execute without enough confirmations", async function () {
    const multiSig = await deployFixture();
    await owner1.sendTransaction({ to: multiSig.address, value: parseEther("1") });
    await multiSig.write.submitTransaction(
      [owner2.account.address, parseEther("0.5"), "0x"],
      { account: owner1.account }
    );
    await multiSig.write.confirmTransaction([0n], { account: owner1.account });
    let failed = false;
    try {
      await multiSig.write.executeTransaction([0n], { account: owner1.account });
    } catch { failed = true; }
    assert.equal(failed, true);
  });
});