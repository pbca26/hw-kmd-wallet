mkdir bin
mkdir bin/win64
mkdir bin/linux64
mkdir bin/osx
cd bin/win64
wget https://github.com/pbca26/libnspv/releases/download/v0.3/nspv-win.tar
tar -xvf nspv-win.tar
rm nspv-win.tar
cd ../linux64
wget https://github.com/pbca26/libnspv/releases/download/v0.3/nspv-linux.tar
tar -xvf nspv-linux.tar
rm nspv-linux.tar
cd ../osx
wget https://github.com/pbca26/libnspv/releases/download/v0.3/nspv-osx.tar
tar -xvf nspv-osx.tar
rm nspv-osx.tar