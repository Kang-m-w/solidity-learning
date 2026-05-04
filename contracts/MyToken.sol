// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./ManagedAccess.sol";

contract MyToken is ManagedAccess {
  event Transfer(address indexed from, address indexed to, uint256 value);
  event Approval(address indexed spender, uint256 amount);

  string public name;
  string public symbol;
  uint8 public decimals;

  uint256 public totalSupply;
  mapping(address => uint256) public balanceOf;
  mapping(address => mapping(address => uint256)) public allowance;

  constructor(
    string memory _name,
    string memory _symbol,
    uint8 _decimals,
    uint256 _amount,
    address[] memory _managers
  ) ManagedAccess(msg.sender, _managers) {
    name = _name;
    symbol = _symbol;
    decimals = _decimals;
    _mint(_amount * 10 ** uint256(decimals), msg.sender);
  }

  function approve(address spender, uint256 amount) external {
    allowance[msg.sender][spender] = amount;

    emit Approval(spender, amount);
  }

  function transferFrom(address from, address to, uint256 amount) external {
    address spender = msg.sender;

    require(allowance[from][spender] >= amount, "insufficient allowance");

    allowance[from][spender] -= amount;
    balanceOf[from] -= amount;
    balanceOf[to] += amount;

    emit Transfer(from, to, amount);
  }

  function mint(uint256 amount, address to) external onlyManager onlyAllConfirmed {
    _mint(amount, to);
  }

  function setManager(address _manager) external onlyAllConfirmed {
  require(_manager != address(0), "Invalid manager");
  require(!isManager[_manager], "Duplicated manager");

  isManager[_manager] = true;
}

  function _mint(uint256 amount, address to) internal {
    totalSupply += amount;
    balanceOf[to] += amount;

    emit Transfer(address(0), to, amount);
  }

  function transfer(uint256 amount, address to) external {
    require(balanceOf[msg.sender] >= amount, "insufficient balance");

    balanceOf[msg.sender] -= amount;
    balanceOf[to] += amount;

    emit Transfer(msg.sender, to, amount);
  }
}