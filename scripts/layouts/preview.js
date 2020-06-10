import { html, render } from 'https://unpkg.com/htm/preact/standalone.module.js'
import launchGame from "../launchgame.js"
// render(html`<a href="/">Hello!</a>`, document.body);
let cururl = new URL(window.location.href);
let sid = cururl.searchParams.get("sid");
let bid = cururl.searchParams.get("bid");
// version look up
let version = null;
{
    let xhr = new XMLHttpRequest();
    let url = "https://api.sayobot.cn/v2/beatmapinfo?T=1&K=" + bid;
    xhr.responseType = 'text';
    xhr.open("GET", url);
    xhr.onload = function () {
        let res = JSON.parse(xhr.response);
        console.log(res)
        for (let i = 0; i < res.data.bid_data.length; ++i)
            if (res.data.bid_data[i].bid == bid)
                version = res.data.bid_data[i].version;
    }
    xhr.send();
}
// download beatmap
let url = "https://txy1.sayobot.cn/beatmaps/download/mini/" + sid;
let xhr = new XMLHttpRequest();
xhr.responseType = 'arraybuffer';
xhr.open("GET", url);
// create download progress bar
const title = html`<div class="title">${sid}</div>`
const progresses = ["script", "skin", 'sound'].map(p => html`
<div class= id="${p}-progress">
    ${p.toUpperCase()}
    <div class="lds-dual-ring"></div>
</div>`)
const container = html`<div class="download-progress">${progresses}${title}</div>`

const statuslines = document.getElementById("statuslines");
render(container, statuslines)

const bar = document.createElement("progress");
bar.max = 1;
bar.value = 0;
statuslines.appendChild(bar)


// async part
function start() {
    function f() {
        window.game.backgroundDimRate = 50 / 100;
        window.game.backgroundBlurRate = 5 / 100;
        window.game.autoplay = true;
        window.game.masterVolume = 10 / 100;
        window.game.previewMode = true;
        launchGame(window.oszblob, bid, version);
        // function wtf(){
        //     if (window.playback)
        //         window.playback.pause = function(){};
        //     else
        //         window.setTimeout(wtf, 50);
        // }
        // wtf();
        window.removeEventListener("click", f);
        // document.getElementById("hint").innerText = "Data may corrupted if playback failed";
    };
    window.addEventListener("click", f);
    document.getElementById("hint").innerText = "Click to START";
}
xhr.onload = function () {
    window.oszblob = new Blob([xhr.response]);
    bar.className = "finished";
    function checktostart() {
        if (!window.scriptReady || !window.soundReady || !window.skinReady) {
            window.setTimeout(checktostart, 50);
            return;
        }
        start();
    }
    checktostart();
}
xhr.onprogress = function (e) {
    bar.value = e.loaded / e.total;
}
xhr.onerror = function () {
    console.error("download failed");
    alert("Beatmap download failed.")
    log_to_server("fail " + box.sid);
}
xhr.send();

if (window.beatmaplistLoadedCallback) {
    window.beatmaplistLoadedCallback();
    window.beatmaplistLoadedCallback = null;
    // to make sure it's called only once
}