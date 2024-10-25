import 'dotenv/config';
import 'hardhat-deploy';
import { HardhatUserConfig } from 'hardhat/config';
import '@nomiclabs/hardhat-ethers';
import '@nomiclabs/hardhat-waffle';
import '@typechain/hardhat';
import 'hardhat-gas-reporter';
import 'hardhat-abi-exporter';

// Hardhat User Configuration
const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.20',
    settings: {
      optimizer: {
        enabled: true,      // 启用优化器
        runs: 50,          // 设置为200次运行，常见的推荐值
      },
      viaIR: true,           // 启用 Intermediate Representation 优化（提升进一步优化效果）
    },
  },
  paths: {
    deploy: './deploy',       // 部署脚本路径
    sources: './src',         // Solidity 源文件路径
  },
  namedAccounts: {
    deployer: { default: 0 },  // 默认部署者账户
    admin: { default: 0 },     // 管理员账户
    second: { default: 1 },    // 第二个账户
    random: { default: 8 },    // 随机账户
  },
  abiExporter: {
    runOnCompile: true,        // 在每次编译时自动导出 ABI
    path: '../frontend/src/abis',  // ABI 文件导出路径
    clear: true,               // 清除之前的 ABI 文件
    flat: true,                // 平铺导出
    only: [],                  // 导出所有合约的 ABI
    pretty: true,              // 美化 ABI 文件
  },
  typechain: {
    outDir: '../typechain',     // TypeChain 类型文件输出路径
  },

};

export default config;
