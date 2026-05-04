import hre from "hardhat";
import { expect } from "chai";
import { DECIMALS, MINTING_AMOUNT } from "./constant";
import { MyToken, TinyBank } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("TinyBank", () => {
  let signers: HardhatEthersSigner[];
  let myTokenC: MyToken;
  let tinyBankC: TinyBank;

  beforeEach(async () => {
    signers = await hre.ethers.getSigners();

    const managers = [
      signers[0].address,
      signers[1].address,
      signers[2].address,
    ];

    myTokenC = await hre.ethers.deployContract("MyToken", [
      "MyToken",
      "MT",
      DECIMALS,
      MINTING_AMOUNT,
      managers,
    ]);

    tinyBankC = await hre.ethers.deployContract("TinyBank", [
      await myTokenC.getAddress(),
      managers,
    ]);

    await myTokenC.connect(signers[0]).confirm();
    await myTokenC.connect(signers[1]).confirm();
    await myTokenC.connect(signers[2]).confirm();

    await myTokenC.setManager(await tinyBankC.getAddress());
  });

  describe("Initialized state check", () => {
    it("should return totalStaked 0", async () => {
      expect(await tinyBankC.totalStaked()).equal(0);
    });

    it("should return staked 0 amount of signer0", async () => {
      expect(await tinyBankC.staked(signers[0].address)).equal(0);
    });
  });

  describe("Staking", () => {
    it("should return staked amount", async () => {
      const signer0 = signers[0];
      const stakingAmount = hre.ethers.parseUnits("50", DECIMALS);

      await myTokenC.approve(await tinyBankC.getAddress(), stakingAmount);
      await tinyBankC.stake(stakingAmount);

      expect(await tinyBankC.staked(signer0.address)).equal(stakingAmount);
      expect(await tinyBankC.totalStaked()).equal(stakingAmount);
      expect(await myTokenC.balanceOf(await tinyBankC.getAddress())).equal(
        stakingAmount,
      );
    });

    it("should revert when staking 0 amount", async () => {
      await expect(tinyBankC.stake(0)).to.be.revertedWith(
        "cannot stake 0 amount",
      );
    });
  });

  describe("Withdraw", () => {
    it("should return 0 staked after withdrawing total token", async () => {
      const signer0 = signers[0];
      const stakingAmount = hre.ethers.parseUnits("50", DECIMALS);

      await myTokenC.approve(await tinyBankC.getAddress(), stakingAmount);
      await tinyBankC.stake(stakingAmount);
      await tinyBankC.withdraw(stakingAmount);

      expect(await tinyBankC.staked(signer0.address)).equal(0);
    });

    it("should revert when withdrawing more than staked amount", async () => {
      const stakingAmount = hre.ethers.parseUnits("50", DECIMALS);
      const withdrawAmount = hre.ethers.parseUnits("51", DECIMALS);

      await myTokenC.approve(await tinyBankC.getAddress(), stakingAmount);
      await tinyBankC.stake(stakingAmount);

      await expect(tinyBankC.withdraw(withdrawAmount)).to.be.revertedWith(
        "insufficient staked token",
      );
    });
  });

  describe("Reward", () => {
    it("should reward token after blocks", async () => {
      const signer0 = signers[0];
      const stakingAmount = hre.ethers.parseUnits("50", DECIMALS);

      await myTokenC.approve(await tinyBankC.getAddress(), stakingAmount);
      await tinyBankC.stake(stakingAmount);

      const beforeBalance = await myTokenC.balanceOf(signer0.address);

      await hre.ethers.provider.send("hardhat_mine", ["0x5"]);

      await tinyBankC.withdraw(stakingAmount);

      const afterBalance = await myTokenC.balanceOf(signer0.address);

      expect(afterBalance).to.be.gt(beforeBalance);
    });

    it("should revert when changing rewardPerBlock by not manager", async () => {
      const hacker = signers[4];
      const rewardToChange = hre.ethers.parseUnits("10000", DECIMALS);

      await expect(
        tinyBankC.connect(hacker).setRewardPerBlock(rewardToChange),
      ).to.be.revertedWith("You are not a manager");
    });

    it("should revert when not all managers confirmed yet", async () => {
      const managers = [
        signers[0].address,
        signers[1].address,
        signers[2].address,
      ];

      const newTinyBankC = await hre.ethers.deployContract("TinyBank", [
        await myTokenC.getAddress(),
        managers,
      ]);

      const rewardToChange = hre.ethers.parseUnits("10000", DECIMALS);

      await expect(
        newTinyBankC.connect(signers[0]).setRewardPerBlock(rewardToChange),
      ).to.be.revertedWith("Not all confirmed yet");
    });

    it("should allow manager to change rewardPerBlock after all confirmed", async () => {
      const rewardToChange = hre.ethers.parseUnits("10000", DECIMALS);

      await tinyBankC.connect(signers[0]).confirm();
      await tinyBankC.connect(signers[1]).confirm();
      await tinyBankC.connect(signers[2]).confirm();

      await expect(
        tinyBankC.connect(signers[0]).setRewardPerBlock(rewardToChange),
      ).to.not.be.reverted;

      expect(await tinyBankC.rewardPerBlock()).equal(rewardToChange);
    });
  });
});