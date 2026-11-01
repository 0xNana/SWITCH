// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test, console2} from "forge-std/Test.sol";
import {Afterlife} from "../Afterlife.sol";
import {MockERC20} from "../test-helpers/MockERC20.sol";

/// @title  AfterlifeTest
/// @notice Comprehensive unit + fuzz test suite for the Afterlife dead-man's switch vault.
///
/// USDC is hardcoded in the contract at 0x3600…0000 as an immutable.
/// We deploy a MockERC20, then vm.etch its runtime bytecode at that address so every
/// call from Afterlife hits our mock.  Storage is *not* copied by vm.etch, so we seed
/// all balances via usdc.mint() on the rebound handle.
contract AfterlifeTest is Test {
    // ─────────────────────────────────────────────────────────────────────────
    //  Constants
    // ─────────────────────────────────────────────────────────────────────────

    address internal constant USDC_ADDR = 0x3600000000000000000000000000000000000000;
    uint256 internal constant MIN_WINDOW = 1 days;
    uint256 internal constant MAX_WINDOW = 3650 days;
    uint256 internal constant BASIS_POINTS = 10_000;
    uint256 internal constant ONE_USDC = 1e6; // 6-decimal USDC
    uint256 internal constant HUNDRED_USDC = 100e6;

    // ─────────────────────────────────────────────────────────────────────────
    //  State
    // ─────────────────────────────────────────────────────────────────────────

    Afterlife internal afterlife;
    MockERC20 internal usdc;

    address internal owner   = makeAddr("owner");
    address internal alice   = makeAddr("alice");
    address internal bob     = makeAddr("bob");
    address internal carol   = makeAddr("carol");
    address internal dave    = makeAddr("dave");
    address internal anyone  = makeAddr("anyone");

    // ─────────────────────────────────────────────────────────────────────────
    //  setUp — runs before every test
    // ─────────────────────────────────────────────────────────────────────────

    function setUp() public {
        // 1. Deploy a throwaway MockERC20 to get its runtime bytecode.
        MockERC20 proto = new MockERC20("Mock USDC", "mUSDC", 6);

        // 2. Etch the bytecode at the canonical USDC address used by the contract.
        vm.etch(USDC_ADDR, address(proto).code);

        // 3. Bind a typed handle to the canonical address.
        usdc = MockERC20(USDC_ADDR);

        // 4. Deploy the Afterlife contract (constructor binds usdc immutable).
        afterlife = new Afterlife(MIN_WINDOW);
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  Internal helpers
    // ─────────────────────────────────────────────────────────────────────────

    /// @dev Create a simple 1-beneficiary vault (alice, 10000 bp) owned by `owner_`.
    function _createSimpleVault(address owner_) internal returns (uint256 id) {
        address[] memory bens = new address[](1);
        bens[0] = alice;
        uint16[] memory shares = new uint16[](1);
        shares[0] = 10_000;
        vm.prank(owner_);
        id = afterlife.createVault("TestVault", bens, shares, MIN_WINDOW, 0);
    }

    /// @dev Create a vault owned by `owner_` with two beneficiaries (alice 5000, bob 5000).
    function _createTwoBenVault(address owner_) internal returns (uint256 id) {
        address[] memory bens = new address[](2);
        bens[0] = alice;
        bens[1] = bob;
        uint16[] memory shares = new uint16[](2);
        shares[0] = 5_000;
        shares[1] = 5_000;
        vm.prank(owner_);
        id = afterlife.createVault("TwoVault", bens, shares, MIN_WINDOW, 0);
    }

    /// @dev Mint USDC to `addr` and approve `spender` for `amount`.
    function _fund(address addr, address spender, uint256 amount) internal {
        usdc.mint(addr, amount);
        vm.prank(addr);
        usdc.approve(spender, amount);
    }

    /// @dev Advance time past the vault window so it's expired.
    function _expire(uint256 id) internal {
        (, , uint256 window, uint256 lastCheckIn, , , , , ) = afterlife.getVault(id);
        vm.warp(lastCheckIn + window + 1);
    }

    /// @dev Deposit `amount` USDC into vault `id` from `from`.
    function _deposit(address from, uint256 id, uint256 amount) internal {
        _fund(from, address(afterlife), amount);
        vm.prank(from);
        afterlife.deposit(id, amount);
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  1. createVault — happy path
    // ─────────────────────────────────────────────────────────────────────────

    function test_CreateVault_HappyPath() public {
        address[] memory bens = new address[](2);
        bens[0] = alice;
        bens[1] = bob;
        uint16[] memory shares = new uint16[](2);
        shares[0] = 4_000;
        shares[1] = 6_000;

        uint256 ts = block.timestamp;

        vm.expectEmit(true, true, false, true, address(afterlife));
        emit Afterlife.VaultCreated(0, owner, "MyVault", MIN_WINDOW);

        vm.prank(owner);
        uint256 id = afterlife.createVault("MyVault", bens, shares, MIN_WINDOW, 0);

        assertEq(id, 0);
        assertEq(afterlife.nextVaultId(), 1);

        (
            address vOwner,
            bytes32 vName,
            uint256 vWindow,
            uint256 vLastCheckIn,
            uint256 vBalance,
            uint256 vReleasedBalance,
            Afterlife.VaultStatus vStatus,
            address[] memory vBenAddrs,
            uint16[] memory vBenShares
        ) = afterlife.getVault(id);

        assertEq(vOwner, owner);
        assertEq(vName, "MyVault");
        assertEq(vWindow, MIN_WINDOW);
        assertEq(vLastCheckIn, ts);
        assertEq(vBalance, 0);
        assertEq(vReleasedBalance, 0);
        assertEq(uint8(vStatus), uint8(Afterlife.VaultStatus.Active));
        assertEq(vBenAddrs.length, 2);
        assertEq(vBenAddrs[0], alice);
        assertEq(vBenAddrs[1], bob);
        assertEq(vBenShares[0], 4_000);
        assertEq(vBenShares[1], 6_000);
    }

    function test_CreateVault_WithInitialDeposit() public {
        address[] memory bens = new address[](1);
        bens[0] = alice;
        uint16[] memory shares = new uint16[](1);
        shares[0] = 10_000;

        _fund(owner, address(afterlife), HUNDRED_USDC);

        vm.expectEmit(true, true, false, true, address(afterlife));
        emit Afterlife.Deposited(0, owner, HUNDRED_USDC);

        vm.prank(owner);
        uint256 id = afterlife.createVault("DepositVault", bens, shares, MIN_WINDOW, HUNDRED_USDC);

        (, , , , uint256 vBalance, , , , ) = afterlife.getVault(id);
        assertEq(vBalance, HUNDRED_USDC);
        assertEq(usdc.balanceOf(address(afterlife)), HUNDRED_USDC);
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  2. createVault — validation reverts
    // ─────────────────────────────────────────────────────────────────────────

    function test_CreateVault_Revert_EmptyName() public {
        address[] memory bens = new address[](1);
        bens[0] = alice;
        uint16[] memory shares = new uint16[](1);
        shares[0] = 10_000;

        vm.prank(owner);
        vm.expectRevert(Afterlife.EmptyName.selector);
        afterlife.createVault(bytes32(0), bens, shares, MIN_WINDOW, 0);
    }

    function test_CreateVault_Revert_InvalidWindow_TooShort() public {
        address[] memory bens = new address[](1);
        bens[0] = alice;
        uint16[] memory shares = new uint16[](1);
        shares[0] = 10_000;

        vm.prank(owner);
        vm.expectRevert(Afterlife.InvalidWindow.selector);
        afterlife.createVault("TestVault", bens, shares, MIN_WINDOW - 1, 0);
    }

    function test_CreateVault_Revert_InvalidWindow_TooLong() public {
        address[] memory bens = new address[](1);
        bens[0] = alice;
        uint16[] memory shares = new uint16[](1);
        shares[0] = 10_000;

        vm.prank(owner);
        vm.expectRevert(Afterlife.InvalidWindow.selector);
        afterlife.createVault("TestVault", bens, shares, MAX_WINDOW + 1, 0);
    }

    function test_CreateVault_Revert_InvalidBeneficiaries_Empty() public {
        address[] memory bens = new address[](0);
        uint16[] memory shares = new uint16[](0);

        vm.prank(owner);
        vm.expectRevert(Afterlife.InvalidBeneficiaries.selector);
        afterlife.createVault("TestVault", bens, shares, MIN_WINDOW, 0);
    }

    function test_CreateVault_Revert_InvalidBeneficiaries_TooMany() public {
        // MAX_BENEFICIARIES is 10; pass 11
        address[] memory bens = new address[](11);
        uint16[] memory shares = new uint16[](11);
        for (uint256 i = 0; i < 11; i++) {
            bens[i] = makeAddr(string(abi.encodePacked("ben", i)));
            shares[i] = 909;
        }
        shares[10] = 901; // total = 9*909 + 901 = 10000, irrelevant – revert fires first

        vm.prank(owner);
        vm.expectRevert(Afterlife.InvalidBeneficiaries.selector);
        afterlife.createVault("TestVault", bens, shares, MIN_WINDOW, 0);
    }

    function test_CreateVault_Revert_InvalidBeneficiaries_MismatchedLength() public {
        address[] memory bens = new address[](2);
        bens[0] = alice;
        bens[1] = bob;
        uint16[] memory shares = new uint16[](1);
        shares[0] = 10_000;

        vm.prank(owner);
        vm.expectRevert(Afterlife.InvalidBeneficiaries.selector);
        afterlife.createVault("TestVault", bens, shares, MIN_WINDOW, 0);
    }

    function test_CreateVault_Revert_ZeroAddress() public {
        address[] memory bens = new address[](1);
        bens[0] = address(0);
        uint16[] memory shares = new uint16[](1);
        shares[0] = 10_000;

        vm.prank(owner);
        vm.expectRevert(Afterlife.ZeroAddress.selector);
        afterlife.createVault("TestVault", bens, shares, MIN_WINDOW, 0);
    }

    function test_CreateVault_Revert_OwnerAsBeneficiary() public {
        address[] memory bens = new address[](1);
        bens[0] = owner; // owner trying to be beneficiary
        uint16[] memory shares = new uint16[](1);
        shares[0] = 10_000;

        vm.prank(owner);
        vm.expectRevert(Afterlife.OwnerAsBeneficiary.selector);
        afterlife.createVault("TestVault", bens, shares, MIN_WINDOW, 0);
    }

    function test_CreateVault_Revert_DuplicateBeneficiary() public {
        address[] memory bens = new address[](2);
        bens[0] = alice;
        bens[1] = alice; // duplicate
        uint16[] memory shares = new uint16[](2);
        shares[0] = 5_000;
        shares[1] = 5_000;

        vm.prank(owner);
        vm.expectRevert(Afterlife.DuplicateBeneficiary.selector);
        afterlife.createVault("TestVault", bens, shares, MIN_WINDOW, 0);
    }

    function test_CreateVault_Revert_ZeroShare() public {
        address[] memory bens = new address[](2);
        bens[0] = alice;
        bens[1] = bob;
        uint16[] memory shares = new uint16[](2);
        shares[0] = 0;    // zero share
        shares[1] = 10_000;

        vm.prank(owner);
        vm.expectRevert(Afterlife.ZeroShare.selector);
        afterlife.createVault("TestVault", bens, shares, MIN_WINDOW, 0);
    }

    function test_CreateVault_Revert_InvalidShares_SumNot10000() public {
        address[] memory bens = new address[](2);
        bens[0] = alice;
        bens[1] = bob;
        uint16[] memory shares = new uint16[](2);
        shares[0] = 5_000;
        shares[1] = 4_999; // sum = 9999, not 10000

        vm.prank(owner);
        vm.expectRevert(Afterlife.InvalidShares.selector);
        afterlife.createVault("TestVault", bens, shares, MIN_WINDOW, 0);
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  3. deposit
    // ─────────────────────────────────────────────────────────────────────────

    function test_Deposit_HappyPath_ThirdParty() public {
        uint256 id = _createSimpleVault(owner);

        // anyone can deposit
        _fund(anyone, address(afterlife), HUNDRED_USDC);

        vm.expectEmit(true, true, false, true, address(afterlife));
        emit Afterlife.Deposited(id, anyone, HUNDRED_USDC);

        vm.prank(anyone);
        afterlife.deposit(id, HUNDRED_USDC);

        (, , , , uint256 bal, , , , ) = afterlife.getVault(id);
        assertEq(bal, HUNDRED_USDC);
        assertEq(usdc.balanceOf(address(afterlife)), HUNDRED_USDC);
    }

    function test_Deposit_Revert_VaultNotActive_Closed() public {
        uint256 id = _createSimpleVault(owner);
        vm.prank(owner);
        afterlife.close(id);

        _fund(anyone, address(afterlife), ONE_USDC);
        vm.prank(anyone);
        vm.expectRevert(Afterlife.VaultNotActive.selector);
        afterlife.deposit(id, ONE_USDC);
    }

    function test_Deposit_Revert_VaultNotActive_Released() public {
        uint256 id = _createSimpleVault(owner);
        _deposit(anyone, id, HUNDRED_USDC);
        _expire(id);

        afterlife.release(id);

        _fund(anyone, address(afterlife), ONE_USDC);
        vm.prank(anyone);
        vm.expectRevert(Afterlife.VaultNotActive.selector);
        afterlife.deposit(id, ONE_USDC);
    }

    function test_Deposit_Revert_ZeroAmount() public {
        uint256 id = _createSimpleVault(owner);
        vm.prank(anyone);
        vm.expectRevert(Afterlife.ZeroAmount.selector);
        afterlife.deposit(id, 0);
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  4. checkIn
    // ─────────────────────────────────────────────────────────────────────────

    function test_CheckIn_HappyPath() public {
        uint256 id = _createSimpleVault(owner);
        uint256 ts = block.timestamp + 7 days;
        vm.warp(ts);

        vm.expectEmit(true, true, false, true, address(afterlife));
        emit Afterlife.CheckedIn(id, owner, ts);

        vm.prank(owner);
        afterlife.checkIn(id);

        (, , , uint256 lastCheckIn, , , , , ) = afterlife.getVault(id);
        assertEq(lastCheckIn, ts);
    }

    function test_CheckIn_Revert_NotOwner() public {
        uint256 id = _createSimpleVault(owner);
        vm.prank(alice);
        vm.expectRevert(Afterlife.NotOwner.selector);
        afterlife.checkIn(id);
    }

    function test_CheckIn_Revert_VaultNotActive_Closed() public {
        uint256 id = _createSimpleVault(owner);
        vm.prank(owner);
        afterlife.close(id);

        vm.prank(owner);
        vm.expectRevert(Afterlife.VaultNotActive.selector);
        afterlife.checkIn(id);
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  5. withdraw
    // ─────────────────────────────────────────────────────────────────────────

    function test_Withdraw_HappyPath() public {
        uint256 id = _createSimpleVault(owner);
        _deposit(anyone, id, HUNDRED_USDC);

        uint256 ownerBalBefore = usdc.balanceOf(owner);
        uint256 ts = block.timestamp;

        vm.expectEmit(true, true, false, true, address(afterlife));
        emit Afterlife.Withdrawn(id, owner, 50e6);
        vm.expectEmit(true, true, false, true, address(afterlife));
        emit Afterlife.CheckedIn(id, owner, ts);

        vm.prank(owner);
        afterlife.withdraw(id, 50e6);

        // vault balance decreased
        (, , , uint256 lastCheckIn, uint256 vBal, , , , ) = afterlife.getVault(id);
        assertEq(vBal, HUNDRED_USDC - 50e6);
        // owner received USDC
        assertEq(usdc.balanceOf(owner), ownerBalBefore + 50e6);
        // heartbeat updated
        assertEq(lastCheckIn, ts);
    }

    function test_Withdraw_Revert_NotOwner() public {
        uint256 id = _createSimpleVault(owner);
        _deposit(anyone, id, HUNDRED_USDC);

        vm.prank(alice);
        vm.expectRevert(Afterlife.NotOwner.selector);
        afterlife.withdraw(id, ONE_USDC);
    }

    function test_Withdraw_Revert_InsufficientBalance() public {
        uint256 id = _createSimpleVault(owner);
        _deposit(anyone, id, ONE_USDC);

        vm.prank(owner);
        vm.expectRevert(Afterlife.InsufficientBalance.selector);
        afterlife.withdraw(id, ONE_USDC + 1);
    }

    function test_Withdraw_Revert_AlreadyExpired() public {
        uint256 id = _createSimpleVault(owner);
        _deposit(anyone, id, HUNDRED_USDC);
        _expire(id);

        vm.prank(owner);
        vm.expectRevert(Afterlife.AlreadyExpired.selector);
        afterlife.withdraw(id, ONE_USDC);
    }

    function test_Withdraw_Revert_VaultNotActive() public {
        uint256 id = _createSimpleVault(owner);
        vm.prank(owner);
        afterlife.close(id);

        vm.prank(owner);
        vm.expectRevert(Afterlife.VaultNotActive.selector);
        afterlife.withdraw(id, ONE_USDC);
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  6. setBeneficiaries
    // ─────────────────────────────────────────────────────────────────────────

    function test_SetBeneficiaries_HappyPath() public {
        uint256 id = _createSimpleVault(owner); // alice 10000

        address[] memory newBens = new address[](2);
        newBens[0] = bob;
        newBens[1] = carol;
        uint16[] memory newShares = new uint16[](2);
        newShares[0] = 6_000;
        newShares[1] = 4_000;

        uint256 ts = block.timestamp;

        vm.expectEmit(true, true, false, false, address(afterlife));
        emit Afterlife.BeneficiariesUpdated(id, owner);
        vm.expectEmit(true, true, false, true, address(afterlife));
        emit Afterlife.CheckedIn(id, owner, ts);

        vm.prank(owner);
        afterlife.setBeneficiaries(id, newBens, newShares);

        (, , , uint256 lastCheckIn, , , , address[] memory addrs, uint16[] memory shs) =
            afterlife.getVault(id);
        assertEq(addrs.length, 2);
        assertEq(addrs[0], bob);
        assertEq(addrs[1], carol);
        assertEq(shs[0], 6_000);
        assertEq(shs[1], 4_000);
        assertEq(lastCheckIn, ts);

        // old beneficiary (alice) no longer appears in vaultsOfBeneficiary
        uint256[] memory aliceVaults = afterlife.vaultsOfBeneficiary(alice);
        bool found = false;
        for (uint256 i = 0; i < aliceVaults.length; i++) {
            if (aliceVaults[i] == id) found = true;
        }
        assertFalse(found, "alice should be removed from beneficiary list");

        // new beneficiaries appear
        uint256[] memory bobVaults = afterlife.vaultsOfBeneficiary(bob);
        assertTrue(bobVaults.length > 0 && bobVaults[0] == id);
    }

    function test_SetBeneficiaries_Revert_NotOwner() public {
        uint256 id = _createSimpleVault(owner);
        address[] memory newBens = new address[](1);
        newBens[0] = carol;
        uint16[] memory newShares = new uint16[](1);
        newShares[0] = 10_000;

        vm.prank(alice);
        vm.expectRevert(Afterlife.NotOwner.selector);
        afterlife.setBeneficiaries(id, newBens, newShares);
    }

    function test_SetBeneficiaries_Revert_AlreadyExpired() public {
        uint256 id = _createSimpleVault(owner);
        _expire(id);

        address[] memory newBens = new address[](1);
        newBens[0] = carol;
        uint16[] memory newShares = new uint16[](1);
        newShares[0] = 10_000;

        vm.prank(owner);
        vm.expectRevert(Afterlife.AlreadyExpired.selector);
        afterlife.setBeneficiaries(id, newBens, newShares);
    }

    function test_SetBeneficiaries_Revert_VaultNotActive() public {
        uint256 id = _createSimpleVault(owner);
        vm.prank(owner);
        afterlife.close(id);

        address[] memory newBens = new address[](1);
        newBens[0] = carol;
        uint16[] memory newShares = new uint16[](1);
        newShares[0] = 10_000;

        vm.prank(owner);
        vm.expectRevert(Afterlife.VaultNotActive.selector);
        afterlife.setBeneficiaries(id, newBens, newShares);
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  7. close
    // ─────────────────────────────────────────────────────────────────────────

    function test_Close_HappyPath_RefundsBalance() public {
        uint256 id = _createSimpleVault(owner);
        _deposit(anyone, id, HUNDRED_USDC);

        uint256 ownerBalBefore = usdc.balanceOf(owner);

        vm.expectEmit(true, true, false, true, address(afterlife));
        emit Afterlife.VaultClosed(id, owner, HUNDRED_USDC);

        vm.prank(owner);
        afterlife.close(id);

        (, , , , uint256 vBal, , Afterlife.VaultStatus vStatus, , ) = afterlife.getVault(id);
        assertEq(vBal, 0);
        assertEq(uint8(vStatus), uint8(Afterlife.VaultStatus.Closed));
        assertEq(usdc.balanceOf(owner), ownerBalBefore + HUNDRED_USDC);
    }

    function test_Close_HappyPath_ZeroBalance() public {
        uint256 id = _createSimpleVault(owner);

        vm.expectEmit(true, true, false, true, address(afterlife));
        emit Afterlife.VaultClosed(id, owner, 0);

        vm.prank(owner);
        afterlife.close(id);

        (, , , , , , Afterlife.VaultStatus vStatus, , ) = afterlife.getVault(id);
        assertEq(uint8(vStatus), uint8(Afterlife.VaultStatus.Closed));
    }

    function test_Close_Revert_NotOwner() public {
        uint256 id = _createSimpleVault(owner);
        vm.prank(alice);
        vm.expectRevert(Afterlife.NotOwner.selector);
        afterlife.close(id);
    }

    function test_Close_Revert_VaultNotActive_AlreadyClosed() public {
        uint256 id = _createSimpleVault(owner);
        vm.prank(owner);
        afterlife.close(id);

        vm.prank(owner);
        vm.expectRevert(Afterlife.VaultNotActive.selector);
        afterlife.close(id);
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  8. release timing
    // ─────────────────────────────────────────────────────────────────────────

    function test_Release_Revert_TooEarly() public {
        uint256 id = _createSimpleVault(owner);
        _deposit(anyone, id, HUNDRED_USDC);

        // Still inside the window
        (, , uint256 window, uint256 lastCheckIn, , , , , ) = afterlife.getVault(id);
        vm.warp(lastCheckIn + window - 1);

        vm.expectRevert(Afterlife.NotExpired.selector);
        afterlife.release(id);
    }

    function test_Release_Revert_AtDeadlineExact() public {
        uint256 id = _createSimpleVault(owner);
        _deposit(anyone, id, HUNDRED_USDC);

        (, , uint256 window, uint256 lastCheckIn, , , , , ) = afterlife.getVault(id);
        // Condition is `block.timestamp <= lastCheckIn + window` → still reverts at exact deadline
        vm.warp(lastCheckIn + window);

        vm.expectRevert(Afterlife.NotExpired.selector);
        afterlife.release(id);
    }

    function test_Release_Succeeds_AfterDeadline() public {
        uint256 id = _createSimpleVault(owner);
        _deposit(anyone, id, HUNDRED_USDC);
        _expire(id);

        uint256 ts = block.timestamp;

        vm.expectEmit(true, false, false, true, address(afterlife));
        emit Afterlife.Released(id, HUNDRED_USDC, ts);

        afterlife.release(id);

        (, , , , , uint256 relBal, Afterlife.VaultStatus status, , ) = afterlife.getVault(id);
        assertEq(uint8(status), uint8(Afterlife.VaultStatus.Released));
        assertEq(relBal, HUNDRED_USDC);
    }

    function test_Release_OwnerRevival_CheckInResetsWindow() public {
        uint256 id = _createSimpleVault(owner);
        _deposit(anyone, id, HUNDRED_USDC);

        // Advance halfway through window
        (, , uint256 window, uint256 lastCheckIn, , , , , ) = afterlife.getVault(id);
        vm.warp(lastCheckIn + window / 2);

        // Owner checks in — heartbeat resets
        vm.prank(owner);
        afterlife.checkIn(id);

        // Advance from NEW lastCheckIn to what would have been old expiry
        (, , , uint256 newCheckIn, , , , , ) = afterlife.getVault(id);
        vm.warp(newCheckIn + window - 1);

        // Still NotExpired because window reset
        vm.expectRevert(Afterlife.NotExpired.selector);
        afterlife.release(id);

        // Now actually expire it
        vm.warp(newCheckIn + window + 1);
        afterlife.release(id);

        (, , , , , , Afterlife.VaultStatus status, , ) = afterlife.getVault(id);
        assertEq(uint8(status), uint8(Afterlife.VaultStatus.Released));
    }

    function test_Release_Revert_ZeroAmount() public {
        uint256 id = _createSimpleVault(owner);
        // No deposit — balance is 0
        _expire(id);

        vm.expectRevert(Afterlife.ZeroAmount.selector);
        afterlife.release(id);
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  9. Exact shares + rounding dust (3 beneficiaries: 3333, 3333, 3334 bp)
    // ─────────────────────────────────────────────────────────────────────────

    function test_ExactShares_RoundingDust_SumsToBalance() public {
        // Create vault with 3 beneficiaries: shares 3333, 3333, 3334
        address[] memory bens = new address[](3);
        bens[0] = alice;
        bens[1] = bob;
        bens[2] = carol;
        uint16[] memory shares = new uint16[](3);
        shares[0] = 3_333;
        shares[1] = 3_333;
        shares[2] = 3_334;

        vm.prank(owner);
        uint256 id = afterlife.createVault("DustVault", bens, shares, MIN_WINDOW, 0);

        // Deposit exactly 100 USDC (100_000_000 with 6 decimals)
        _deposit(anyone, id, HUNDRED_USDC);
        _expire(id);
        afterlife.release(id);

        // claim each beneficiary
        uint256 aliceBefore = usdc.balanceOf(alice);
        uint256 bobBefore   = usdc.balanceOf(bob);
        uint256 carolBefore = usdc.balanceOf(carol);

        afterlife.claim(id, 0); // alice
        afterlife.claim(id, 1); // bob
        afterlife.claim(id, 2); // carol

        uint256 alicePayout = usdc.balanceOf(alice) - aliceBefore;
        uint256 bobPayout   = usdc.balanceOf(bob)   - bobBefore;
        uint256 carolPayout = usdc.balanceOf(carol) - carolBefore;

        // Sum must equal exactly 100 USDC — no dust left behind
        assertEq(alicePayout + bobPayout + carolPayout, HUNDRED_USDC, "Sum of payouts != 100 USDC");

        // The last beneficiary absorbs rounding dust via the contract's dust-sweep logic
        uint256 expected0 = (HUNDRED_USDC * 3_333) / 10_000; // 33_330_000
        uint256 expected1 = (HUNDRED_USDC * 3_333) / 10_000; // 33_330_000
        uint256 expected2 = HUNDRED_USDC - expected0 - expected1; // 33_340_000
        assertEq(alicePayout, expected0);
        assertEq(bobPayout,   expected1);
        assertEq(carolPayout, expected2);
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  10. Third-party claim — anyone can call claim/claimAll
    // ─────────────────────────────────────────────────────────────────────────

    function test_Claim_AnyoneCanCall() public {
        uint256 id = _createSimpleVault(owner);
        _deposit(anyone, id, HUNDRED_USDC);
        _expire(id);
        afterlife.release(id);

        uint256 aliceBefore = usdc.balanceOf(alice);

        // `anyone` (not alice) calls claim on behalf of index 0 (alice)
        vm.prank(anyone);
        afterlife.claim(id, 0);

        assertEq(usdc.balanceOf(alice), aliceBefore + HUNDRED_USDC);
    }

    function test_ClaimAll_AnyoneCanCall() public {
        uint256 id = _createTwoBenVault(owner);
        _deposit(anyone, id, HUNDRED_USDC);
        _expire(id);
        afterlife.release(id);

        uint256 aliceBefore = usdc.balanceOf(alice);
        uint256 bobBefore   = usdc.balanceOf(bob);

        vm.prank(dave); // unrelated party
        afterlife.claimAll(id);

        assertEq(usdc.balanceOf(alice), aliceBefore + 50e6);
        assertEq(usdc.balanceOf(bob),   bobBefore   + 50e6);
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  11. claimAll with a blocked beneficiary
    // ─────────────────────────────────────────────────────────────────────────

    function test_ClaimAll_SkipsBlockedBeneficiary() public {
        uint256 id = _createTwoBenVault(owner); // alice 5000, bob 5000
        _deposit(anyone, id, HUNDRED_USDC);
        _expire(id);
        afterlife.release(id);

        // Make USDC transfer to alice fail
        usdc.setFailTransferTo(alice);

        uint256 bobBefore = usdc.balanceOf(bob);

        // claimAll should skip alice (transfer fails) but pay bob
        afterlife.claimAll(id);

        // bob was paid
        assertEq(usdc.balanceOf(bob), bobBefore + 50e6);

        // alice received nothing
        assertEq(usdc.balanceOf(alice), 0);

        // alice's claimed slot must still be 0 — was NOT marked as claimed (skipped)
        assertEq(afterlife.claimedAmount(id, 0), 0, "alice slot should be unclaimed");
        assertEq(afterlife.claimedAmount(id, 1), 50e6, "bob slot should be claimed");
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  12. beneficiary discovery
    // ─────────────────────────────────────────────────────────────────────────

    function test_VaultsOfBeneficiary() public {
        uint256 id0 = _createSimpleVault(owner); // alice is beneficiary of vault 0

        // create another vault by a different owner also with alice
        address owner2 = makeAddr("owner2");
        address[] memory bens = new address[](1);
        bens[0] = alice;
        uint16[] memory shares = new uint16[](1);
        shares[0] = 10_000;
        vm.prank(owner2);
        uint256 id1 = afterlife.createVault("Vault2", bens, shares, MIN_WINDOW, 0);

        uint256[] memory aliceVaults = afterlife.vaultsOfBeneficiary(alice);
        assertEq(aliceVaults.length, 2);
        assertEq(aliceVaults[0], id0);
        assertEq(aliceVaults[1], id1);
    }

    function test_VaultsOfOwner() public {
        uint256 id0 = _createSimpleVault(owner);

        address[] memory bens = new address[](1);
        bens[0] = bob;
        uint16[] memory shares = new uint16[](1);
        shares[0] = 10_000;
        vm.prank(owner);
        uint256 id1 = afterlife.createVault("Vault2", bens, shares, MIN_WINDOW, 0);

        uint256[] memory ownerVaults = afterlife.vaultsOfOwner(owner);
        assertEq(ownerVaults.length, 2);
        assertEq(ownerVaults[0], id0);
        assertEq(ownerVaults[1], id1);
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  13. AlreadyClaimed revert on double-claim
    // ─────────────────────────────────────────────────────────────────────────

    function test_Claim_Revert_AlreadyClaimed() public {
        uint256 id = _createSimpleVault(owner);
        _deposit(anyone, id, HUNDRED_USDC);
        _expire(id);
        afterlife.release(id);

        afterlife.claim(id, 0);

        vm.expectRevert(Afterlife.AlreadyClaimed.selector);
        afterlife.claim(id, 0);
    }

    function test_Claim_Revert_VaultNotReleased() public {
        uint256 id = _createSimpleVault(owner);
        _deposit(anyone, id, HUNDRED_USDC);

        vm.expectRevert(Afterlife.VaultNotReleased.selector);
        afterlife.claim(id, 0);
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  14. Fuzz: vault window bounds
    // ─────────────────────────────────────────────────────────────────────────

    function testFuzz_VaultWindowBounds(uint256 window_) public {
        address[] memory bens = new address[](1);
        bens[0] = alice;
        uint16[] memory shares = new uint16[](1);
        shares[0] = 10_000;

        // Clamp to valid range [MIN_WINDOW, MAX_WINDOW]
        uint256 validWindow = bound(window_, MIN_WINDOW, MAX_WINDOW);

        vm.prank(owner);
        uint256 id = afterlife.createVault("FuzzVault", bens, shares, validWindow, 0);

        (, , uint256 storedWindow, , , , , , ) = afterlife.getVault(id);
        assertEq(storedWindow, validWindow);
    }

    function testFuzz_VaultWindow_TooShort_Reverts(uint256 window_) public {
        // Any window strictly less than MIN_WINDOW must revert
        vm.assume(window_ < MIN_WINDOW); // always a cheap bound (< 1 day = 86400 values)

        address[] memory bens = new address[](1);
        bens[0] = alice;
        uint16[] memory shares = new uint16[](1);
        shares[0] = 10_000;

        vm.prank(owner);
        vm.expectRevert(Afterlife.InvalidWindow.selector);
        afterlife.createVault("FuzzVault", bens, shares, window_, 0);
    }

    function testFuzz_VaultWindow_TooLong_Reverts(uint256 window_) public {
        // Any window strictly greater than MAX_WINDOW must revert
        window_ = bound(window_, MAX_WINDOW + 1, type(uint256).max);

        address[] memory bens = new address[](1);
        bens[0] = alice;
        uint16[] memory shares = new uint16[](1);
        shares[0] = 10_000;

        vm.prank(owner);
        vm.expectRevert(Afterlife.InvalidWindow.selector);
        afterlife.createVault("FuzzVault", bens, shares, window_, 0);
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  Bonus: constructor validation
    // ─────────────────────────────────────────────────────────────────────────

    function test_Constructor_Revert_MinWindowTooShort() public {
        vm.expectRevert(Afterlife.InvalidWindow.selector);
        new Afterlife(1 days - 1);
    }

    function test_Constructor_ValidMinWindow() public {
        Afterlife a = new Afterlife(1 days);
        assertEq(a.minWindow(), 1 days);
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  Bonus: InvalidVaultId
    // ─────────────────────────────────────────────────────────────────────────

    function test_InvalidVaultId_Revert() public {
        // No vaults created yet — id 0 is invalid
        vm.expectRevert(Afterlife.InvalidVaultId.selector);
        afterlife.getVault(0);
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  Bonus: isExpired / deadline view helpers
    // ─────────────────────────────────────────────────────────────────────────

    function test_IsExpired_FalseBeforeDeadline() public {
        uint256 id = _createSimpleVault(owner);
        assertFalse(afterlife.isExpired(id));
    }

    function test_IsExpired_TrueAfterDeadline() public {
        uint256 id = _createSimpleVault(owner);
        _expire(id);
        assertTrue(afterlife.isExpired(id));
    }

    function test_Deadline_EqualsLastCheckInPlusWindow() public {
        uint256 id = _createSimpleVault(owner);
        (, , uint256 window, uint256 lastCheckIn, , , , , ) = afterlife.getVault(id);
        assertEq(afterlife.deadline(id), lastCheckIn + window);
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  Bonus: shareOf view helper
    // ─────────────────────────────────────────────────────────────────────────

    function test_ShareOf_ReturnsBeneficiaryShare() public {
        uint256 id = _createTwoBenVault(owner); // alice 5000, bob 5000
        assertEq(afterlife.shareOf(id, alice), 5_000);
        assertEq(afterlife.shareOf(id, bob),   5_000);
        assertEq(afterlife.shareOf(id, carol),  0);   // not a beneficiary
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  Bonus: Multiple vaults, independent state
    // ─────────────────────────────────────────────────────────────────────────

    function test_MultipleVaults_IndependentState() public {
        uint256 id0 = _createSimpleVault(owner);  // alice beneficiary
        uint256 id1 = _createTwoBenVault(owner);  // alice + bob

        _deposit(anyone, id0, 10e6);
        _deposit(anyone, id1, 20e6);

        (, , , , uint256 bal0, , , , ) = afterlife.getVault(id0);
        (, , , , uint256 bal1, , , , ) = afterlife.getVault(id1);
        assertEq(bal0, 10e6);
        assertEq(bal1, 20e6);

        // Close vault 0 — vault 1 unaffected
        vm.prank(owner);
        afterlife.close(id0);

        (, , , , , , Afterlife.VaultStatus s0, , ) = afterlife.getVault(id0);
        (, , , , , , Afterlife.VaultStatus s1, , ) = afterlife.getVault(id1);
        assertEq(uint8(s0), uint8(Afterlife.VaultStatus.Closed));
        assertEq(uint8(s1), uint8(Afterlife.VaultStatus.Active));
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  Bonus: Fuzz deposit round-trip
    // ─────────────────────────────────────────────────────────────────────────

    function testFuzz_Deposit_BalanceAccumulates(uint256 amount) public {
        amount = bound(amount, 1, 1_000_000e6); // 1 to 1M USDC
        uint256 id = _createSimpleVault(owner);
        _deposit(anyone, id, amount);

        (, , , , uint256 bal, , , , ) = afterlife.getVault(id);
        assertEq(bal, amount);
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  Bonus: withdraw reduces balance and resets heartbeat
    // ─────────────────────────────────────────────────────────────────────────

    function testFuzz_Withdraw_BalanceDecreases(uint256 depositAmt, uint256 withdrawAmt) public {
        depositAmt  = bound(depositAmt,  1, 1_000_000e6);
        withdrawAmt = bound(withdrawAmt, 1, depositAmt);

        uint256 id = _createSimpleVault(owner);
        _deposit(anyone, id, depositAmt);

        uint256 tsBefore = block.timestamp;
        vm.warp(tsBefore + 1);

        vm.prank(owner);
        afterlife.withdraw(id, withdrawAmt);

        (, , , uint256 lastCheckIn, uint256 bal, , , , ) = afterlife.getVault(id);
        assertEq(bal, depositAmt - withdrawAmt);
        assertEq(lastCheckIn, tsBefore + 1);
    }
}
