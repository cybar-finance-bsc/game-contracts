async function main() {
    const Lottery = await ethers.getContractFactory("Lottery.sol");
    const Lottery = await MyContract.deploy("Lottery.sol");

    console.log("Lottery deployed to:", Lottery.address);
    console.log("Lottery deployed to:", Lottery.address);
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });