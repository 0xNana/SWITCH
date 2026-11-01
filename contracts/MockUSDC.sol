// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @dev TEST/LOCAL ONLY. Mimics Arc's USDC ERC-20 interface (6 decimals) plus Arc-like rules:
///      transfers to/from address(0) revert and a blocklist makes transfers revert.
contract MockUSDC {
    string public constant name = "USD Coin (mock)";
    string public constant symbol = "USDC";
    uint8 public constant decimals = 6;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    mapping(address => bool) public blocklisted;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    function mint(address to, uint256 amount) external { balanceOf[to] += amount; emit Transfer(address(0), to, amount); }
    function setBlocklisted(address who, bool b) external { blocklisted[who] = b; }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount; emit Approval(msg.sender, spender, amount); return true;
    }
    function transfer(address to, uint256 amount) external returns (bool) { _t(msg.sender, to, amount); return true; }
    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        uint256 a = allowance[from][msg.sender];
        require(a >= amount, "allowance");
        if (a != type(uint256).max) allowance[from][msg.sender] = a - amount;
        _t(from, to, amount); return true;
    }
    function _t(address from, address to, uint256 amount) private {
        require(to != address(0), "zero address");
        require(!blocklisted[from] && !blocklisted[to], "blocklisted");
        require(balanceOf[from] >= amount, "balance");
        balanceOf[from] -= amount; balanceOf[to] += amount; emit Transfer(from, to, amount);
    }
}
