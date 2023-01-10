# Etherium Coaster Contract

This project is a smart contract that can be used as a digital coaster.
The intention is that an innkeeper issues a digital coaster to his guest and collects the food and drinks consumed on it.
Thereby, the host specifies the token with which the guest must pay and the maximum amount of debts until the contract should not incur any further debts.

A condition of the contract is that the guest gives the contract a direct debit authorization (allowance) for the corresponding token.
```javascript
token.approve(<coaster.address>, <amount>);
```
With this permission, the contract is able to make all payments.
When the guest has settled his debts, the innkeeper can withdraw the balance of the contract.