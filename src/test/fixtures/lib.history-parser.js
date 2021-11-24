const transactionsHistory = {
  "raw": {
    "received": {
      "confirmations": 580297,
      "timestamp": 1510734416,
      "blocktime": 1510734416,
      "height": 100,
      "txid": "1531fcf212c2d015bede1e01b54440f8a50187838a5d3632a27d1b5f01d8ec00",
      "vin":[{
        "addr": "bYKaDcHiwamTdep23Shq1DLGHxmnJg3R4J",
        "satoshi": 15989999,
        "value": 0.15989999,
        "n": 0,
        "scriptPubKey": {
          "asm": "OP_HASH160 d6e729236ab1b78badfef438279384d09f332afa OP_EQUAL",
          "hex": "a914d6e729236ab1b78badfef438279384d09f332afa87",
          "type": "scripthash",
          "addresses": [ "bYKaDcHiwamTdep23Shq1DLGHxmnJg3R4J" ]
        }
      }],
      "vout":[{
        "addr": "RDbGxL8QYdEp8sMULaVZS2E6XThcTKT9Jd",
        "satoshi": 15979999,
        "value": 0.15979999,
        "n": 0,
        "scriptPubKey": {
          "asm": "OP_DUP OP_HASH160 2f4c0f91fc06ac228c120aee41741d0d39096832 OP_EQUALVERIFY OP_CHECKSIG",
          "hex": "76a9142f4c0f91fc06ac228c120aee41741d0d3909683288ac",
          "type": "pubkeyhash",
          "addresses": [ "RDbGxL8QYdEp8sMULaVZS2E6XThcTKT9Jd" ]
        }
      }]
    },
    "sent": {
      "confirmations": 580297,
      "timestamp": 1520734416,
      "blocktime": 1520734416,
      "height": 110,
      "txid": "1531fcf212c2d015bede1e01b54440f8a50187838a5d3632a27d1b5f01d8ec00",
      "vin":[{
        "addr": "RDbGxL8QYdEp8sMULaVZS2E6XThcTKT9Jd",
        "satoshi": 100000000,
        "value": 1,
        "n": 0,
        "scriptPubKey": {
          "asm": "OP_HASH160 2f4c0f91fc06ac228c120aee41741d0d39096832 OP_EQUAL",
          "hex": "76a9142f4c0f91fc06ac228c120aee41741d0d3909683288ac",
          "type": "scripthash",
          "addresses": [ "RDbGxL8QYdEp8sMULaVZS2E6XThcTKT9Jd" ]
        }
      }],
      "vout":[{
        "satoshi": 90000000,
        "value": 0.9,
        "n": 0,
        "addr": "bYKaDcHiwamTdep23Shq1DLGHxmnJg3R4J",
        "scriptPubKey": {
          "asm": "OP_DUP OP_HASH160 2f4c0f91fc06ac228c120aee41741d0d39096832 OP_EQUALVERIFY OP_CHECKSIG",
          "hex": "76a9142f4c0f91fc06ac228c120aee41741d0d3909683288ac",
          "type": "pubkeyhash",
          "addresses": [ "bYKaDcHiwamTdep23Shq1DLGHxmnJg3R4J" ]
        }
      }]
    },
  },
  "decoded": {
    "partial": [
      {
        "amount":0.15989999,
        "confirmations":0,
        "date":"pending",
        "height":"unknown",
        "timestamp":"pending",
        "txid":"1531fcf212c2d015bede1e01b54440f8a50187838a5d3632a27d1b5f01d8ec00",
        "type":"received"
      }
    ],
    "received": [
      {
        "amount":0.15989999,
        "confirmations":580297,
        "date":"15 Nov 2017 11:26",
        "height":100,
        "timestamp":1510734416,
        "txid":"1531fcf212c2d015bede1e01b54440f8a50187838a5d3632a27d1b5f01d8ec00",
        "type":"received"
      }
    ],
    "receivedNoAddress": [
      {
        "amount":0.0001,
        "confirmations": 580297,
        "date":"15 Nov 2017 11:26",
        "height":100,
        "timestamp":1510734416,
        "txid":"1531fcf212c2d015bede1e01b54440f8a50187838a5d3632a27d1b5f01d8ec00",
        "type":"sent"
      }
    ],
    "sent": [
      {
        "type":"sent",
        "amount":0.9999,
        "timestamp":1520734416,
        "date":"11 Mar 2018 05:13",
        "txid":"1531fcf212c2d015bede1e01b54440f8a50187838a5d3632a27d1b5f01d8ec00",
        "height":110,
        "confirmations":580297
      }
    ],
    "sortedASC": [
      {
        "amount":0.9999,
        "confirmations":580297,
        "date":"11 Mar 2018 05:13",
        "height":110,
        "timestamp":1520734416,
        "txid":"1531fcf212c2d015bede1e01b54440f8a50187838a5d3632a27d1b5f01d8ec00",
        "type":"sent"
      },
      {
        "amount":0.15989999,
        "confirmations":580297,
        "date":"15 Nov 2017 11:26",
        "height":100,
        "timestamp":1510734416,
        "txid":"1531fcf212c2d015bede1e01b54440f8a50187838a5d3632a27d1b5f01d8ec00",
        "type":"received"
      }
    ]
  },
};

module.exports = transactionsHistory;