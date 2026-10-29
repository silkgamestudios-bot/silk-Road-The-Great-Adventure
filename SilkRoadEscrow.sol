// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title Silk Road Escrow
/// @notice Holds an allow-listed ERC-20 payment until Silk Road's trusted resolver
/// confirms in-game delivery. The resolver pays gas for release/refund transactions.
/// @dev Deploy only after independent review. The contract cannot itself verify game inventory.
interface IERC20Minimal {
    function transfer(address to, uint256 value) external returns (bool);
    function transferFrom(address from, address to, uint256 value) external returns (bool);
}

contract SilkRoadEscrow {
    enum Status { None, Funded, Disputed, Released, Refunded }

    struct Order {
        address buyer;
        address seller;
        uint128 amount;
        uint64 createdAt;
        Status status;
    }

    IERC20Minimal public immutable paymentToken;
    address public immutable feeRecipient;
    address public resolver;
    uint16 public immutable feeBps;
    address public owner;
    uint256 private entered = 1;

    mapping(bytes32 => Order) public orders;

    event OrderFunded(bytes32 indexed orderId, address indexed buyer, address indexed seller, uint256 amount);
    event DisputeRaised(bytes32 indexed orderId, address indexed by);
    event OrderReleased(bytes32 indexed orderId, uint256 sellerAmount, uint256 feeAmount);
    event OrderRefunded(bytes32 indexed orderId, uint256 amount);
    event ResolverChanged(address indexed oldResolver, address indexed newResolver);
    event OwnershipTransferred(address indexed oldOwner, address indexed newOwner);

    modifier onlyOwner() { require(msg.sender == owner, "NOT_OWNER"); _; }
    modifier onlyResolver() { require(msg.sender == resolver, "NOT_RESOLVER"); _; }
    modifier nonReentrant() { require(entered == 1, "REENTRANT"); entered = 2; _; entered = 1; }

    constructor(address token, address initialResolver, address initialFeeRecipient) {
        require(token != address(0) && initialResolver != address(0) && initialFeeRecipient != address(0), "ZERO_ADDRESS");
        paymentToken = IERC20Minimal(token);
        resolver = initialResolver;
        feeRecipient = initialFeeRecipient;
        feeBps = 500; // 5% sales commission
        owner = msg.sender;
        emit OwnershipTransferred(address(0), msg.sender);
    }

    /// @notice Buyer must first approve this contract to spend `amount` tokens.
    /// @param orderId Unique, server-generated order ID (bytes32), never reused.
    function fund(bytes32 orderId, address seller, uint256 amount) external nonReentrant {
        require(orderId != bytes32(0), "BAD_ORDER_ID");
        require(orders[orderId].status == Status.None, "ORDER_EXISTS");
        require(seller != address(0) && seller != msg.sender, "BAD_SELLER");
        require(amount > 0 && amount <= type(uint128).max, "BAD_AMOUNT");

        orders[orderId] = Order({buyer: msg.sender, seller: seller, amount: uint128(amount), createdAt: uint64(block.timestamp), status: Status.Funded});
        _safeTransferFrom(msg.sender, address(this), amount);
        emit OrderFunded(orderId, msg.sender, seller, amount);
    }

    /// @notice Buyer or seller can freeze a funded order while a dispute is reviewed.
    function raiseDispute(bytes32 orderId) external {
        Order storage o = orders[orderId];
        require(o.status == Status.Funded, "NOT_FUNDABLE");
        require(msg.sender == o.buyer || msg.sender == o.seller, "NOT_PARTY");
        o.status = Status.Disputed;
        emit DisputeRaised(orderId, msg.sender);
    }

    /// @notice Resolver calls only after the game server durably confirms delivery.
    /// @dev Silk Road's resolver wallet pays gas; seller does not need BNB.
    function release(bytes32 orderId) external onlyResolver nonReentrant {
        Order storage o = orders[orderId];
        require(o.status == Status.Funded, "NOT_FUNDED");
        _release(orderId, o);
    }

    /// @notice Resolver returns buyer funds if delivery cannot be completed.
    function refund(bytes32 orderId) external onlyResolver nonReentrant {
        Order storage o = orders[orderId];
        require(o.status == Status.Funded || o.status == Status.Disputed, "NOT_REFUNDABLE");
        o.status = Status.Refunded;
        uint256 amount = o.amount;
        _safeTransfer(o.buyer, amount);
        emit OrderRefunded(orderId, amount);
    }

    /// @notice Explicit dispute outcome. Use release only after delivery is verified.
    function resolveRelease(bytes32 orderId) external onlyResolver nonReentrant {
        Order storage o = orders[orderId];
        require(o.status == Status.Disputed, "NOT_DISPUTED");
        _release(orderId, o);
    }

    function _release(bytes32 orderId, Order storage o) private {
        uint256 gross = o.amount;
        uint256 fee = (gross * feeBps) / 10_000;
        uint256 sellerNet = gross - fee;
        o.status = Status.Released; // update before external token calls
        if (fee > 0) _safeTransfer(feeRecipient, fee);
        _safeTransfer(o.seller, sellerNet);
        emit OrderReleased(orderId, sellerNet, fee);
    }

    function setResolver(address newResolver) external onlyOwner {
        require(newResolver != address(0), "ZERO_ADDRESS");
        emit ResolverChanged(resolver, newResolver);
        resolver = newResolver;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "ZERO_ADDRESS");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    function _safeTransfer(address to, uint256 amount) private {
        (bool ok, bytes memory data) = address(paymentToken).call(abi.encodeWithSelector(IERC20Minimal.transfer.selector, to, amount));
        require(ok && (data.length == 0 || abi.decode(data, (bool))), "TOKEN_TRANSFER_FAILED");
    }

    function _safeTransferFrom(address from, address to, uint256 amount) private {
        (bool ok, bytes memory data) = address(paymentToken).call(abi.encodeWithSelector(IERC20Minimal.transferFrom.selector, from, to, amount));
        require(ok && (data.length == 0 || abi.decode(data, (bool))), "TOKEN_TRANSFER_FROM_FAILED");
    }
}
