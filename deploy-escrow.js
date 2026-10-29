const hre = require("hardhat");

async function main() {
  const token = process.env.TEST_TOKEN_ADDRESS;
  const resolver = process.env.RESOLVER_ADDRESS;
  const feeRecipient = process.env.FEE_RECIPIENT_ADDRESS;
  for (const [name, value] of Object.entries({ TEST_TOKEN_ADDRESS: token, RESOLVER_ADDRESS: resolver, FEE_RECIPIENT_ADDRESS: feeRecipient })) {
    if (!value || !hre.ethers.isAddress(value) || value === hre.ethers.ZeroAddress) throw new Error(`${name} must be a valid, non-zero address`);
  }
  const [deployer] = await hre.ethers.getSigners();
  if (!deployer) throw new Error("Missing DEPLOYER_PRIVATE_KEY; use a dedicated test wallet only.");
  const Factory = await hre.ethers.getContractFactory("SilkRoadEscrow");
  const escrow = await Factory.deploy(token, resolver, feeRecipient);
  await escrow.waitForDeployment();
  console.log("Network:", (await hre.ethers.provider.getNetwork()).chainId.toString());
  console.log("Deployer:", deployer.address);
  console.log("Escrow:", await escrow.getAddress());
  console.log("Token:", token);
  console.log("Resolver:", resolver);
  console.log("Fee recipient:", feeRecipient);
  console.log("IMPORTANT: Verify the token contract and source before funding any order.");
}
main().catch((e) => { console.error(e); process.exitCode = 1; });
