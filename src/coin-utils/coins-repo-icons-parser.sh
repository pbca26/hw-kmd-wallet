# usage: git clone https://github.com/KomodoPlatform/coins
#!/bin/bash
coinlist=(
  'KMD'
  'AXO'
  'KOIN'
  'MESH'
  'DEX'
  'SUPERNET'
  'CCL'
  'PGT'
  'MSHARK'
  'REVS'
  'PANGEA'
  'JUMBLR'
  'BET'
  'CRYPTO'
  'HODL'
  'ILN'
  'BOTS'
  'MGW'
  'WLC21'
  'COQUICASH'
  'BTCH'
  'NINJA'
  'THC'
  'MCL'
  'LABS'
  'VOTE2021'
  'RICK'
  'MORTY'
  'VRSC'
  'WSB'
  'SPACE'
  'CLC'
  'SOULJA'
)

mkdir coins_copy
for coins in "${coinlist[@]}"; do
  coin=($coins)
  echo $coin
  cp coins/icons/$coin.png coins_copy/$coin.png
done