// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Script} from "forge-std/Script.sol";
import {console2} from "forge-std/console2.sol";
import {SwitchVault} from "../SwitchVault.sol";

contract DeploySwitchVault is Script {
    uint256 internal constant PORTALDOT_V3_CHAIN_ID = 420420777;

    error WrongChain(uint256 actualChainId);

    function run() external returns (SwitchVault vault) {
        if (block.chainid != PORTALDOT_V3_CHAIN_ID) revert WrongChain(block.chainid);

        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);
        vault = new SwitchVault(7 days);
        vm.stopBroadcast();

        console2.log("SwitchVault deployed at:", address(vault));
    }
}
