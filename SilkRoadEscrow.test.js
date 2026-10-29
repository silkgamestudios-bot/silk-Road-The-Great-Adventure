const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SilkRoadEscrow (local mock-token tests)", function () {
  async function setup() {
    const [owner, buyer, seller, resolver, feeRecipient, outsider] = await ethers.getSigners();
    const Token = await ethers.getContractFactory("MockUSDT");
    const token = await Token.deploy();
    const Escrow = await ethers.getContractFactory("SilkRoadEscrow");
    const escrow = await Escrow.deploy(await token.getAddress(), resolver.address, feeRecipient.address);
    const amount = 100n * 10n ** 6n;
    await token.mint(buyer.address, amount);
    await token.connect(buyer).approve(await escrow.getAddress(), amount);
    return { owner, buyer, seller, resolver, feeRecipient, outsider, token, escrow, amount };
  }
  const id = (s) => ethers.id(s);

  it("holds funds, then pays seller 95% and platform 5% after resolver release", async function () {
    const { buyer, seller, resolver, feeRecipient, token, escrow, amount } = await setup();
    await escrow.connect(buyer).fund(id("order-1"), seller.address, amount);
    expect(await token.balanceOf(await escrow.getAddress())).to.equal(amount);
    await expect(escrow.connect(resolver).release(id("order-1")))
      .to.emit(escrow, "OrderReleased").withArgs(id("order-1"), 95n * 10n ** 6n, 5n * 10n ** 6n);
    expect(await token.balanceOf(seller.address)).to.equal(95n * 10n ** 6n);
    expect(await token.balanceOf(feeRecipient.address)).to.equal(5n * 10n ** 6n);
  });
  it("rejects duplicate orders", async function () {
    const { buyer, seller, escrow, amount } = await setup();
    await escrow.connect(buyer).fund(id("duplicate"), seller.address, amount);
    await expect(escrow.connect(buyer).fund(id("duplicate"), seller.address, amount)).to.be.revertedWith("ORDER_EXISTS");
  });
  it("lets buyer or seller dispute, and resolver refund buyer", async function () {
    const { buyer, seller, resolver, token, escrow, amount } = await setup();
    await escrow.connect(buyer).fund(id("dispute"), seller.address, amount);
    await escrow.connect(seller).raiseDispute(id("dispute"));
    await escrow.connect(resolver).refund(id("dispute"));
    expect(await token.balanceOf(buyer.address)).to.equal(amount);
  });
  it("rejects outsider release and non-party dispute", async function () {
    const { buyer, seller, outsider, token, escrow, amount } = await setup();
    await escrow.connect(buyer).fund(id("auth"), seller.address, amount);
    await expect(escrow.connect(outsider).release(id("auth"))).to.be.revertedWith("NOT_RESOLVER");
    await expect(escrow.connect(outsider).raiseDispute(id("auth"))).to.be.revertedWith("NOT_PARTY");
  });
});
