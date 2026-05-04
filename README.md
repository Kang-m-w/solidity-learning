# Sample Hardhat Project

This project demonstrates a basic Hardhat use case. It comes with a sample contract, a test for that contract, and a Hardhat Ignition module that deploys that contract.

Try running some of the following tasks:

```shell
npx hardhat help
npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat node
npx hardhat ignition deploy ./ignition/modules/Lock.ts
```

```
hardhat-test
├─ contracts
│  ├─ MyToken.sol
│  └─ TinyBank.sol
├─ hardhat.config.ts
├─ ignition
│  └─ modules
│     └─ MyToken.ts
├─ package-lock.json
├─ package.json
├─ README.md
├─ test
│  ├─ constant.ts
│  ├─ MyToken.ts
│  └─ TinyBank.ts
└─ tsconfig.json

```