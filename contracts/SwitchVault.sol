// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract SwitchVault is ReentrancyGuard {
    struct Beneficiary {
        address addr;
        uint16 share;
    }

    enum VaultStatus {
        None,
        Active,
        Released,
        Closed
    }

    struct Vault {
        address owner;
        bytes32 name;
        uint256 window;
        uint256 lastCheckIn;
        uint256 balance;
        uint256 releasedBalance;
        Beneficiary[] beneficiaries;
        VaultStatus status;
        mapping(address => bool) isBeneficiary;
        mapping(uint256 => uint256) claimed;
    }

    error ZeroAddress();
    error InvalidWindow();
    error InvalidBeneficiaries();
    error DuplicateBeneficiary();
    error OwnerAsBeneficiary();
    error InvalidShares();
    error ZeroShare();
    error ZeroAmount();
    error NotOwner();
    error VaultNotActive();
    error VaultNotReleased();
    error NotExpired();
    error AlreadyExpired();
    error AlreadyClaimed();
    error InsufficientBalance();
    error TooManyBeneficiaries();
    error InvalidVaultId();
    error EmptyName();
    error TransferFailed();

    event VaultCreated(uint256 indexed id, address indexed owner, bytes32 name, uint256 window);
    event Deposited(uint256 indexed id, address indexed from, uint256 amount);
    event CheckedIn(uint256 indexed id, address indexed owner, uint256 timestamp);
    event Withdrawn(uint256 indexed id, address indexed owner, uint256 amount);
    event BeneficiariesUpdated(uint256 indexed id, address indexed owner);
    event Released(uint256 indexed id, uint256 balance, uint256 timestamp);
    event Claimed(uint256 indexed id, uint256 indexed index, address indexed beneficiary, uint256 amount);
    event VaultClosed(uint256 indexed id, address indexed owner, uint256 refund);

    uint256 public constant MAX_WINDOW = 3650 days;
    uint256 public constant GRACE_PERIOD = 7 days;
    uint256 public constant MAX_BENEFICIARIES = 10;
    uint256 public constant BASIS_POINTS = 10_000;

    mapping(uint256 => Vault) private _vaults;
    uint256 public nextVaultId;
    uint256 public immutable minWindow;
    mapping(address => uint256[]) private _ownerVaults;
    mapping(address => uint256[]) private _beneficiaryVaults;

    constructor(uint256 minWindow_) {
        if (minWindow_ < 1 days || minWindow_ > MAX_WINDOW) revert InvalidWindow();
        minWindow = minWindow_;
    }

    function createVault(
        bytes32 name_,
        address[] calldata beneficiaries_,
        uint16[] calldata shares_,
        uint256 window_
    ) external payable nonReentrant returns (uint256 id) {
        if (name_ == bytes32(0)) revert EmptyName();
        if (window_ < minWindow || window_ > MAX_WINDOW) revert InvalidWindow();

        uint256 length = beneficiaries_.length;
        if (length == 0) revert InvalidBeneficiaries();
        if (length > MAX_BENEFICIARIES) revert InvalidBeneficiaries();
        if (length > type(uint16).max) revert TooManyBeneficiaries();
        if (length != shares_.length) revert InvalidBeneficiaries();

        id = nextVaultId;
        nextVaultId = id + 1;

        Vault storage vault = _vaults[id];
        vault.owner = msg.sender;
        vault.name = name_;
        vault.window = window_;
        vault.lastCheckIn = block.timestamp;
        vault.status = VaultStatus.Active;

        uint256 totalShares;
        for (uint256 i = 0; i < length; ++i) {
            address beneficiary = beneficiaries_[i];
            uint16 share = shares_[i];

            if (beneficiary == address(0)) revert ZeroAddress();
            if (beneficiary == msg.sender) revert OwnerAsBeneficiary();
            if (vault.isBeneficiary[beneficiary]) revert DuplicateBeneficiary();
            if (share == 0) revert ZeroShare();

            vault.beneficiaries.push(Beneficiary({addr: beneficiary, share: share}));
            vault.isBeneficiary[beneficiary] = true;
            _beneficiaryVaults[beneficiary].push(id);
            totalShares += share;
        }

        if (totalShares != BASIS_POINTS) revert InvalidShares();

        _ownerVaults[msg.sender].push(id);

        if (msg.value > 0) {
            vault.balance = msg.value;
            emit Deposited(id, msg.sender, msg.value);
        }

        emit VaultCreated(id, msg.sender, name_, window_);
    }

    function deposit(uint256 id) external payable nonReentrant {
        _requireValidVaultId(id);
        Vault storage vault = _vaults[id];

        if (vault.status != VaultStatus.Active) revert VaultNotActive();
        if (block.timestamp > vault.lastCheckIn + vault.window) revert AlreadyExpired();
        if (msg.value == 0) revert ZeroAmount();

        vault.balance += msg.value;
        emit Deposited(id, msg.sender, msg.value);
    }

    function checkIn(uint256 id) external {
        _requireValidVaultId(id);
        Vault storage vault = _vaults[id];

        if (vault.status != VaultStatus.Active) revert VaultNotActive();
        if (msg.sender != vault.owner) revert NotOwner();

        vault.lastCheckIn = block.timestamp;
        emit CheckedIn(id, msg.sender, block.timestamp);
    }

    function withdraw(uint256 id, uint256 amount) external nonReentrant {
        _requireValidVaultId(id);
        Vault storage vault = _vaults[id];

        if (vault.status != VaultStatus.Active) revert VaultNotActive();
        if (msg.sender != vault.owner) revert NotOwner();
        if (block.timestamp > vault.lastCheckIn + vault.window) revert AlreadyExpired();
        if (amount == 0) revert ZeroAmount();
        if (amount > vault.balance) revert InsufficientBalance();

        vault.balance -= amount;
        vault.lastCheckIn = block.timestamp;

        (bool ok,) = vault.owner.call{value: amount}("");
        if (!ok) revert TransferFailed();

        emit Withdrawn(id, vault.owner, amount);
        emit CheckedIn(id, vault.owner, block.timestamp);
    }

    function setBeneficiaries(
        uint256 id,
        address[] calldata beneficiaries_,
        uint16[] calldata shares_
    ) external nonReentrant {
        _requireValidVaultId(id);
        Vault storage vault = _vaults[id];

        if (vault.status != VaultStatus.Active) revert VaultNotActive();
        if (msg.sender != vault.owner) revert NotOwner();
        if (block.timestamp > vault.lastCheckIn + vault.window) revert AlreadyExpired();

        uint256 length = beneficiaries_.length;
        if (length == 0) revert InvalidBeneficiaries();
        if (length > MAX_BENEFICIARIES) revert InvalidBeneficiaries();
        if (length > type(uint16).max) revert TooManyBeneficiaries();
        if (length != shares_.length) revert InvalidBeneficiaries();

        uint256 oldLength = vault.beneficiaries.length;
        for (uint256 i = 0; i < oldLength; ++i) {
            address oldBeneficiary = vault.beneficiaries[i].addr;
            vault.isBeneficiary[oldBeneficiary] = false;
            _removeFromList(_beneficiaryVaults[oldBeneficiary], id);
        }
        delete vault.beneficiaries;

        uint256 totalShares;
        for (uint256 i = 0; i < length; ++i) {
            address beneficiary = beneficiaries_[i];
            uint16 share = shares_[i];

            if (beneficiary == address(0)) revert ZeroAddress();
            if (beneficiary == vault.owner) revert OwnerAsBeneficiary();
            if (vault.isBeneficiary[beneficiary]) revert DuplicateBeneficiary();
            if (share == 0) revert ZeroShare();

            vault.beneficiaries.push(Beneficiary({addr: beneficiary, share: share}));
            vault.isBeneficiary[beneficiary] = true;
            _beneficiaryVaults[beneficiary].push(id);
            totalShares += share;
        }

        if (totalShares != BASIS_POINTS) revert InvalidShares();

        vault.lastCheckIn = block.timestamp;

        emit BeneficiariesUpdated(id, vault.owner);
        emit CheckedIn(id, vault.owner, block.timestamp);
    }

    function close(uint256 id) external nonReentrant {
        _requireValidVaultId(id);
        Vault storage vault = _vaults[id];

        if (vault.status != VaultStatus.Active) revert VaultNotActive();
        if (msg.sender != vault.owner) revert NotOwner();
        if (block.timestamp > vault.lastCheckIn + vault.window) revert AlreadyExpired();

        vault.status = VaultStatus.Closed;

        uint256 refund = vault.balance;
        vault.balance = 0;

        if (refund > 0) {
            (bool ok,) = vault.owner.call{value: refund}("");
            if (!ok) revert TransferFailed();
        }

        emit VaultClosed(id, vault.owner, refund);
    }

    function release(uint256 id) external nonReentrant {
        _requireValidVaultId(id);
        Vault storage vault = _vaults[id];

        if (vault.status != VaultStatus.Active) revert VaultNotActive();
        if (block.timestamp <= vault.lastCheckIn + vault.window + GRACE_PERIOD) revert NotExpired();
        if (vault.balance == 0) revert ZeroAmount();

        vault.releasedBalance = vault.balance;
        vault.status = VaultStatus.Released;

        emit Released(id, vault.releasedBalance, block.timestamp);
    }

    function claim(uint256 id, uint256 index) external nonReentrant {
        _requireValidVaultId(id);
        Vault storage vault = _vaults[id];

        if (vault.status != VaultStatus.Released) revert VaultNotReleased();
        if (index >= vault.beneficiaries.length) revert InvalidBeneficiaries();
        if (vault.claimed[index] != 0) revert AlreadyClaimed();

        uint256 payout = _payoutFor(vault, index);
        if (payout == 0) revert ZeroAmount();

        vault.claimed[index] = payout;
        vault.balance -= payout;

        address beneficiary = vault.beneficiaries[index].addr;
        (bool ok,) = beneficiary.call{value: payout}("");
        if (!ok) revert TransferFailed();

        emit Claimed(id, index, beneficiary, payout);
    }

    function claimAll(uint256 id) external nonReentrant {
        _requireValidVaultId(id);
        Vault storage vault = _vaults[id];

        if (vault.status != VaultStatus.Released) revert VaultNotReleased();

        uint256 length = vault.beneficiaries.length;
        for (uint256 i = 0; i < length; ++i) {
            if (vault.claimed[i] != 0) continue;

            uint256 payout = _payoutFor(vault, i);
            if (payout == 0) continue;

            address beneficiary = vault.beneficiaries[i].addr;
            if (_tryNativeTransfer(beneficiary, payout)) {
                vault.claimed[i] = payout;
                vault.balance -= payout;
                emit Claimed(id, i, beneficiary, payout);
            }
        }
    }

    function deadline(uint256 id) external view returns (uint256) {
        _requireValidVaultId(id);
        Vault storage vault = _vaults[id];
        return vault.lastCheckIn + vault.window + GRACE_PERIOD;
    }

    function warningAt(uint256 id) external view returns (uint256) {
        _requireValidVaultId(id);
        Vault storage vault = _vaults[id];
        return vault.lastCheckIn + vault.window;
    }

    function isExpired(uint256 id) external view returns (bool) {
        _requireValidVaultId(id);
        Vault storage vault = _vaults[id];
        return block.timestamp > vault.lastCheckIn + vault.window + GRACE_PERIOD;
    }

    function shareOf(uint256 id, address beneficiary) external view returns (uint16) {
        _requireValidVaultId(id);
        Vault storage vault = _vaults[id];

        uint256 length = vault.beneficiaries.length;
        for (uint256 i = 0; i < length; ++i) {
            if (vault.beneficiaries[i].addr == beneficiary) {
                return vault.beneficiaries[i].share;
            }
        }

        return 0;
    }

    function getVault(
        uint256 id
    )
        external
        view
        returns (
            address owner,
            bytes32 name,
            uint256 window,
            uint256 lastCheckIn,
            uint256 balance,
            uint256 releasedBalance,
            VaultStatus status,
            address[] memory beneficiaryAddrs,
            uint16[] memory beneficiaryShares
        )
    {
        _requireValidVaultId(id);
        Vault storage vault = _vaults[id];

        owner = vault.owner;
        name = vault.name;
        window = vault.window;
        lastCheckIn = vault.lastCheckIn;
        balance = vault.balance;
        releasedBalance = vault.releasedBalance;
        status = vault.status;

        uint256 length = vault.beneficiaries.length;
        beneficiaryAddrs = new address[](length);
        beneficiaryShares = new uint16[](length);

        for (uint256 i = 0; i < length; ++i) {
            beneficiaryAddrs[i] = vault.beneficiaries[i].addr;
            beneficiaryShares[i] = vault.beneficiaries[i].share;
        }
    }

    function vaultsOfOwner(address owner) external view returns (uint256[] memory) {
        return _ownerVaults[owner];
    }

    function vaultsOfBeneficiary(address beneficiary) external view returns (uint256[] memory) {
        return _beneficiaryVaults[beneficiary];
    }

    function claimedAmount(uint256 id, uint256 index) external view returns (uint256) {
        _requireValidVaultId(id);
        return _vaults[id].claimed[index];
    }

    function _tryNativeTransfer(address to, uint256 amount) internal returns (bool) {
        (bool ok,) = to.call{value: amount}("");
        return ok;
    }

    function _removeFromList(uint256[] storage list, uint256 id) private {
        uint256 length = list.length;
        for (uint256 i = 0; i < length; ++i) {
            if (list[i] == id) {
                list[i] = list[length - 1];
                list.pop();
                break;
            }
        }
    }

    function _payoutFor(Vault storage vault, uint256 index) internal view returns (uint256) {
        uint256 length = vault.beneficiaries.length;

        if (index == length - 1) {
            uint256 sumOthers;
            for (uint256 i = 0; i < length - 1; ++i) {
                sumOthers += (vault.releasedBalance * vault.beneficiaries[i].share) / BASIS_POINTS;
            }
            return vault.releasedBalance - sumOthers;
        }

        return (vault.releasedBalance * vault.beneficiaries[index].share) / BASIS_POINTS;
    }

    function _requireValidVaultId(uint256 id) internal view {
        if (id >= nextVaultId) revert InvalidVaultId();
    }
}
