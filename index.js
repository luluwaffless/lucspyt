import chalk from "chalk";
import {fileTypeFromBuffer} from 'file-type';
import {searchMusics} from 'node-youtube-music';
import promptSync from "prompt-sync";
import express from "express";
import querystring from "querystring";
import request from 'request';
import axios from 'axios';
import youtubedl from 'youtube-dl-exec';
import NodeID3 from 'node-id3';
import path from 'path';
import {fileURLToPath} from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const prompt = promptSync();
function getMusicMatch(results, title, artist, album) {
    return new Promise((resolve) => {
        for (const result of results) {
            if (result.title === title && result.artists[0].name === artist && result.album === album) {
                resolve(result);
                return;
            };
        };
        resolve(results[0]);
    });
};
function donwload(obj) {
    return new Promise(async function(resolve, reject) {
        const searchquery = `${obj.name} - ${obj.artist}`
        if (!session.searchqueries.includes(searchquery)) {
            session.searchqueries.push(searchquery);
            await searchMusics(searchquery)
                .then(async function(data) {
                    const match = await getMusicMatch(data, obj.name, obj.artist, obj.album);
                    if (match === undefined) {
                        match = data[0];
                    };
                    console.log(`${chalk.magenta("[DOWNLOAD]") + chalk.reset()} Baixando ${chalk.greenBright(searchquery) + chalk.reset()} (${chalk.blueBright("https://www.youtube.com/watch?v=" + match.youtubeId) + chalk.reset()})`)
                    const output = path.normalize(__dirname + `/output/${removeInvalidCharacters(obj.name)}.mp3`);
                    youtubedl(`https://www.youtube.com/watch?v=${match.youtubeId}`, {
                        extractAudio: true,
                        ignoreErrors: true,
                        noWarnings: true,
                        audioFormat: "mp3",
                        output: output
                    }).then(async function() {
                        console.log(`${chalk.cyan("[TAG]") + chalk.reset()} Marcando ${chalk.blueBright(output) + chalk.reset()} (${chalk.greenBright(searchquery) + chalk.reset()})`)
                        const response = await axios.get(obj.img, {
                            responseType: 'arraybuffer'
                        });
                        const buffer = Buffer.from(response.data, "utf-8");
                        const mime = await fileTypeFromBuffer(buffer);
                        NodeID3.write({
                            title: obj.name,
                            artist: obj.artist,
                            album: obj.album,
                            image: {
                                mime: mime.mime,
                                type: {
                                    id: 3
                                },
                                description: "",
                                imageBuffer: buffer
                            }
                        }, output, (err) => {
                            if (!err) { resolve({skipped: false, searchquery: searchquery, output: output}); } else reject({type: 2, err: err});
                        });
                    }).catch((err) => {
                        reject({type: 1, err: err});
                    });
                });
        } else resolve({skipped: true, searchquery: searchquery, output: null});
    });
};
const removeInvalidCharacters = (str) => str.replace().replace(/\\|\/|\:|\*|\?|\"|\<|\>|\|/g, '');
var session = {};

var playlistValid = false;
while (!playlistValid) {
    const playlist = prompt(`${chalk.blue("[ENTRADA]") + chalk.reset()} Insira a URL da sua playlist do Spotify: `);
    if (playlist.startsWith("https://open.spotify.com/playlist/") && playlist.length == 56) {
        playlistValid = true;
        session.playlist = playlist.substr(34);
        console.log(`${chalk.green("[SUCESSO]") + chalk.reset()} Playlist inserida.`);
    } else {
        console.log(`${chalk.yellow("[AVISO]") + chalk.reset()} Por favor insira uma URL válida.`);
    };
};

const app = express();
app.use(express.json());
app.get('/', function(_, res) {
    res.redirect('https://accounts.spotify.com/authorize?' + querystring.stringify({
        response_type: 'code',
        client_id: "c1869af9ccb243a88ab72027d18edb0f",
        scope: 'playlist-read-private playlist-read-collaborative',
        redirect_uri: "http://localhost:5000/callback",
    }));
});
app.get('/callback', function(req, res) {
    res.type("text/html");
    res.send(`<!DOCTYPE html> <html> <head> <meta charset="UTF-8"> <meta http-equiv="X-UA-Compatible" content="IE=edge"> <meta name="viewport" content="width=device-width, initial-scale=1.0"> <title>lucspyt</title> </head> <body style="background-color: black; color: white; text-align: center; font-family: 'Courier New', Courier, monospace; font-size: xx-large;"> <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);"> <span>você pode retornar ao terminal</span> </div> </body> </html>`);
    var code = req.query.code || null;
    if (session.loggedin) {
        console.log(`${chalk.yellow("[AVISO]") + chalk.reset()} Você já fez login.`);
    } else {
        var authOptions = {
            url: 'https://accounts.spotify.com/api/token',
            form: {
                code: code,
                redirect_uri: "http://localhost:5000/callback",
                grant_type: 'authorization_code'
            },
            headers: {
                'Authorization': 'Basic YzE4NjlhZjljY2IyNDNhODhhYjcyMDI3ZDE4ZWRiMGY6YjgxZWQwMjZhYjAwNDNjZTg2NWM2NjY2MzVkZmY1ZGQ='
            },
            json: true
        };
        request.post(authOptions, function(e, r, b) {
            if (!e && r.statusCode === 200) {
                session.loggedin = true
                console.log(`${chalk.green("[SUCESSO]") + chalk.reset()} Login feito.`)
                request.get({
                    url: `https://api.spotify.com/v1/playlists/${session.playlist}/tracks`,
                    headers: {
                        'Authorization': 'Bearer ' + b.access_token
                    }
                }, async function(error, response, body) {
                    if (!error && response.statusCode === 200) {
                        console.log(`${chalk.green("[SUCESSO]") + chalk.reset()} Playlist lida.`)
                        const json = JSON.parse(body);
                        session.results = {};
                        session.results.total = 0;
                        session.results.completed = 0;
                        session.results.tagerror = 0;
                        session.results.downerror = 0;
                        session.results.skipped = 0;
                        session.searchqueries = [];
                        for (const resp of json.items) {
                            await donwload({artist: resp.track.artists[0].name, name: resp.track.name, album: resp.track.album.name, img: resp.track.album.images[0].url})
                                .then((result) => {
                                    if (result.skipped) {
                                        console.log(`${chalk.yellow("[AVISO]") + chalk.reset()} ${chalk.greenBright(result.searchquery) + chalk.reset()} já procurado, pulando.`);
                                        session.results.total += 1;
                                        session.results.skipped += 1;
                                        return;
                                    };
                                    console.log(`${chalk.green("[SUCESSO]") + chalk.reset()} ${chalk.blueBright(result.output) + chalk.reset()} completado (${chalk.greenBright(result.searchquery) + chalk.reset()})`);
                                    session.results.total += 1;
                                    session.results.completed += 1;
                                })
                                .catch((err) => {
                                    if (type === 2) {
                                        console.log(`${chalk.red("[ERROR]") + chalk.reset()} Erro de marcação: ` + err);
                                        session.results.total += 1;
                                        session.results.tagerror += 1;
                                        return;
                                    };
                                    console.log(`${chalk.red("[ERROR]") + chalk.reset()} Erro de download: ` + err);
                                    session.results.total += 1;
                                    session.results.downerror += 1;
                                });
                        };
                        const interval = setInterval(async function() {
                            if (session.results.total === json.items.length) {
                                clearInterval(interval);
                                console.log(`${chalk.greenBright("[PRONTO]") + chalk.reset()} Baixado com sucesso! Você pode encontrar as músicas no diretório "/playlist".\nResultados: ${chalk.white("Total") + chalk.reset()}: ${session.results.total}; ${chalk.green("Completos") + chalk.reset()}: ${session.results.completed}; ${chalk.yellow("Pulados") + chalk.reset()}: ${session.results.skipped}; ${chalk.red("Erro de download") + chalk.reset()}: ${session.results.downerror}; ${chalk.red("Erro de marcação") + chalk.reset()}: ${session.results.tagerror}.`);
                                process.exit();
                            };
                        }, 1000);
                    } else {
                        console.log(`${chalk.red("[ERROR]") + chalk.reset()} Não foi possível ler a playlist. Erro: ` + body);
				        process.exit();
                    };
                });
            } else {
                console.log(`${chalk.red("[ERROR]") + chalk.reset()} Não foi possível fazer login. Erro: ` + body);
                process.exit();
            };
        });
    };
});
app.listen(5000, function() {
    console.log(`${chalk.green("[SUCESSO]") + chalk.reset()} Link de autenticação gerado. Vá para http://localhost:5000 para fazer login.`)
});
