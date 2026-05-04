import hre from "hardhat";
import { expect } from "chai";
import { MyToken } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { DECIMALS, MINTING_AMOUNT } from "./constant";

describe("My Token", () => {
  let myTokenC: MyToken;
  let signers: HardhatEthersSigner[];

  beforeEach("should deploy", async () => {
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
  });

  describe("Basic state value check", () => {
    it("should return name", async () => {
      expect(await myTokenC.name()).equal("MyToken");
    });

    it("should return symbol", async () => {
      expect(await myTokenC.symbol()).equal("MT");
    });

    it("should return decimals", async () => {
      expect(await myTokenC.decimals()).equal(DECIMALS);
    });

    it("should return totalSupply", async () => {
      expect(await myTokenC.totalSupply()).equal(
        MINTING_AMOUNT * 10n ** DECIMALS,
      );
    });

    it("should have at least 3 managers", async () => {
      expect(await myTokenC.managerCount()).equal(3);
    });
  });

  describe("Confirm", () => {
    it("should allow manager to confirm", async () => {
      await expect(myTokenC.connect(signers[0]).confirm()).to.not.be.reverted;
    });

    it("should revert when non-manager confirms", async () => {
      await expect(
        myTokenC.connect(signers[4]).confirm(),
      ).to.be.revertedWith("You are not a manager");
    });

    it("should revert when same manager confirms twice", async () => {
      await myTokenC.connect(signers[0]).confirm();

      await expect(
        myTokenC.connect(signers[0]).confirm(),
      ).to.be.revertedWith("Already confirmed");
    });
  });

  describe("Mint", () => {
    it("should return initial balance for signer 0", async () => {
      expect(await myTokenC.balanceOf(signers[0].address)).equal(
        MINTING_AMOUNT * 10n ** DECIMALS,
      );
    });

    it("should revert when non-manager tries to mint", async () => {
      const hacker = signers[4];
      const mintingAmount = hre.ethers.parseUnits("100", DECIMALS);

      await expect(
        myTokenC.connect(hacker).mint(mintingAmount, hacker.address),
      ).to.be.revertedWith("You are not a manager");
    });

    it("should revert when not all managers confirmed yet", async () => {
      const manager = signers[0];
      const mintingAmount = hre.ethers.parseUnits("100", DECIMALS);

      await myTokenC.connect(signers[0]).confirm();
      await myTokenC.connect(signers[1]).confirm();

      await expect(
        myTokenC.connect(manager).mint(mintingAmount, manager.address),
      ).to.be.revertedWith("Not all confirmed yet");
    });

    it("should allow manager to mint after all managers confirmed", async () => {
      const manager = signers[0];
      const mintingAmount = hre.ethers.parseUnits("100", DECIMALS);

      await myTokenC.connect(signers[0]).confirm();
      await myTokenC.connect(signers[1]).confirm();
      await myTokenC.connect(signers[2]).confirm();

      await expect(
        myTokenC.connect(manager).mint(mintingAmount, manager.address),
      ).to.not.be.reverted;
    });
  });

  describe("Transfer", () => {
    it("should transfer 0.5MT", async () => {
      await expect(
        myTokenC.transfer(
          hre.ethers.parseUnits("0.5", DECIMALS),
          signers[1].address,
        ),
      )
        .to.emit(myTokenC, "Transfer")
        .withArgs(
          signers[0].address,
          signers[1].address,
          hre.ethers.parseUnits("0.5", DECIMALS),
        );

      expect(await myTokenC.balanceOf(signers[1].address)).equal(
        hre.ethers.parseUnits("0.5", DECIMALS),
      );
    });

    it("should revert with insufficient balance error", async () => {
      await expect(
        myTokenC.transfer(
          hre.ethers.parseUnits((MINTING_AMOUNT + 1n).toString(), DECIMALS),
          signers[1].address,
        ),
      ).to.be.revertedWith("insufficient balance");
    });
  });

  describe("TransferFrom", () => {
    it("should emit Approval event", async () => {
      await expect(
        myTokenC.approve(
          signers[1].address,
          hre.ethers.parseUnits("10", DECIMALS),
        ),
      )
        .to.emit(myTokenC, "Approval")
        .withArgs(signers[1].address, hre.ethers.parseUnits("10", DECIMALS));
    });

    it("should revert with insufficient allowance error", async () => {
      await expect(
        myTokenC
          .connect(signers[1])
          .transferFrom(
            signers[0].address,
            signers[1].address,
            hre.ethers.parseUnits("1", DECIMALS),
          ),
      ).to.be.revertedWith("insufficient allowance");
    });

    it("signer1 should move token from signer0", async () => {
      await myTokenC.approve(
        signers[1].address,
        hre.ethers.parseUnits("1", DECIMALS),
      );

      await expect(
        myTokenC
          .connect(signers[1])
          .transferFrom(
            signers[0].address,
            signers[1].address,
            hre.ethers.parseUnits("1", DECIMALS),
          ),
      )
        .to.emit(myTokenC, "Transfer")
        .withArgs(
          signers[0].address,
          signers[1].address,
          hre.ethers.parseUnits("1", DECIMALS),
        );

      expect(await myTokenC.balanceOf(signers[1].address)).equal(
        hre.ethers.parseUnits("1", DECIMALS),
      );
    });
  });
});