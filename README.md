# lucspyt 🎶 [![forthebadge](https://forthebadge.com/images/badges/made-with-javascript.svg)](https://forthebadge.com)
um programa para facilmente baixar sua playlist do spotify
tutorial de como usar em vídeo que até um bebê entende: https://www.youtube.com/watch?v=iMBIrGx2oyE
# requisitos 📚
- [node.js e npm](https://nodejs.org/)
- [ffmpeg](https://ffmpeg.org/)
- [python](https://www.python.org/)
# como usar 💻
1. baixe os requisitos e clone o repositório usando ```git clone https://github.com/luca4s/lucspyt.git && cd lucspyt``` (ou baixe diretamente do github)
2. no terminal do repositório, baixe as dependências utilizando `npm i`
3. inicie o programa com `npm start` ou `node index.js`
4. insira a URL da sua playlist do spotify, deve ter 56 caracteres de tamanho e começar com `https://open.spotify.com/playlist/`
5. vá para `http://localhost:5000` onde você será redirecionado para fazer login com spotify
6. após isso, a sua playlist começara a ser baixada no diretório `/playlist` e pronto!
# como usar (em celular android) 📱
- aviso: o programa foi desenvolvido para ser utilizado em computadores e pode ter problemas de download das músicas no celular!
1. baixe o [termux](https://github.com/termux/termux-app/releases/latest)
2. digite os seguintes comandos:
```shell
pkg update && pkg upgrade
pkg install git
pkg install nodejs
pkg install ffmpeg
pkg install python
```
3. siga os passos para PC
4. digite os senguintes comandos para mover as músicas da playlist do terminal para a pasta de músicas do seu celular:
```sh
termux-setup-storage
mv /output/* ~/storage/music
```
5. utilize seu reprodutor de mídia favorito para reproduzir a playlist
