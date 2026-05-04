// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

abstract contract ManagedAccess {
  address public owner;

  address[] public managers;
  mapping(address => bool) public isManager;
  mapping(address => bool) public confirmed;

  uint256 public confirmCount;

  constructor(address _owner, address[] memory _managers) {
    owner = _owner;

    for (uint256 i = 0; i < _managers.length; i++) {
      address manager = _managers[i];

      require(manager != address(0), "Invalid manager");
      require(!isManager[manager], "Duplicated manager");

      isManager[manager] = true;
      managers.push(manager);
    }
  }

  modifier onlyManager() {
    require(isManager[msg.sender], "You are not a manager");
    _;
  }

  modifier onlyAllConfirmed() {
    require(confirmCount == managers.length, "Not all confirmed yet");
    _;
  }

  function confirm() external onlyManager {
    require(!confirmed[msg.sender], "Already confirmed");

    confirmed[msg.sender] = true;
    confirmCount++;
  }

  function managerCount() external view returns (uint256) {
    return managers.length;
  }
}