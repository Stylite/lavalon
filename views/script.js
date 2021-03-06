const ytdl = require('ytdl-core');
const ytrx = new RegExp('(?:youtube\\.com.*(?:\\?|&)(?:v|list)=|youtube\\.com.*embed\\/|youtube\\.com.*v\\/|youtu\\.be\\/)((?!videoseries)[a-zA-Z0-9_-]*)');

const songs = [];
const songList = document.getElementById('songList');

let currentlyPlaying;
let player;
let volume;

function readURL () {
  setTimeout(() => {
    const url = document.getElementById('urlBox').value;
    if (ytrx.test(url)) {
      getTrackInfo(url);
      document.getElementById('urlBox').value = '';
    }
  }, 100);
}

async function getTrackInfo (url) {
  const info = await ytdl.getInfo(url);

  const streamURL = getBestStream(filterOpus(info.formats));
  if (!streamURL)
    return alert(`Unplayable track: ${info.title}`);

  const song = {
    title: info.title,
    url: streamURL.url,
    id: Date.now().toString() + info.video_id 
  }

  songs.push(song);
  renderSongDiv(song);
}

function SetVolume(val) {
        console.log('Before: ' + player.volume);
        player.volume = val / 100;
        console.log('After: ' + player.volume);
    }

function playSong (song) {
  if (player) 
    player.pause();

  currentlyPlaying = song;
  player = new Audio(song.url);
  player.volume = volume || 1;
  player.onended = () => {
    const currentIndex = songs.indexOf(currentlyPlaying);
    if (!~currentIndex && songs.length > 0 || currentIndex === songs.length - 1)
      return playSong(songs[0]);

    return playSong(songs[currentIndex + 1]);
  };

  document.getElementById('tracktitle').innerHTML = song.title;
  const trackIndex = songs.indexOf(currentlyPlaying);
  player.play();

  const button = document.querySelector('button[onclick="PlayPause()"]');
  button.innerHTML = 'pause';

  const parent = document.querySelector(`.song[index="${trackIndex}"]`);

  if (parent.className.includes('fadein'))
    parent.className = parent.className.replace('fadein ', '');

  const playing = document.querySelector('.playing');
  if (playing)
      playing.className.replace('playing', '');

  document.querySelector(`.song[index="${trackIndex}"]`).className += ' playing';
}

function renderSongDiv (song) {
  const trackIndex = songs.indexOf(song);
  const parent = document.createElement('div');
  parent.setAttribute('index', trackIndex);
  parent.className = 'song fadein container level';
  const children = [];

  const songName = document.createElement('div');
  songName.innerHTML = song.title;
  songName.className = 'songName level-left';
  children.push(songName);

  const btns = document.createElement('div');
  btns.className = 'level-right';

  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'song button';
  deleteBtn.className = 'fa fa-close'
  deleteBtn.onclick = () => {
    parent.parentElement.removeChild(parent);
    if (songs.includes(song)) {
      songs.splice(songs.indexOf(song), 1)
    }
  }
  btns.appendChild(deleteBtn);

  children.push(btns);

  for (const child of children) {
    parent.appendChild(child);
  }

  songList.appendChild(parent);
}

function PlayPause () {
  const button = document.querySelector('button[onclick="PlayPause()"]');

  if (!currentlyPlaying) {
    button.innerHTML = 'pause';
    return playSong(songs[0]);
  }

  const playingSong = document.querySelector(`div[index="${songs.indexOf(currentlyPlaying)}"]`);

  if (player.paused) {
    button.innerHTML = 'pause';
    playingSong.className = playingSong.className.replace('paused', 'playing')
    player.play();
  } else {
    playingSong.className = playingSong.className.replace('playing', '');
    button.innerHTML = 'play_arrow';
    player.pause();
  }
}

function playNext () {
  if (songs.length === 0)
    return;

  const currentIndex = songs.indexOf(currentlyPlaying);
  if (!~currentIndex && songs.length > 0 || currentIndex === songs.length - 1)
    return playSong(songs[0]);

  return playSong(songs[currentIndex + 1]);
}

function playPrev () {
  if (songs.length === 0)
    return;

  const currentIndex = songs.indexOf(currentlyPlaying);
  if (!~currentIndex && songs.length > 0 || currentIndex === 0)
    return playSong(songs[songs.length - 1]);

  return playSong(songs[currentIndex - 1]);
}

function filterOpus(formats) {
    return formats.filter(f => ['251', '250', '249'].includes(f.itag));
}

function getBestStream(streams) {
    streams = Object.values(streams);
    streams.sort((a, b) => b.audioBitrate - a.audioBitrate)
    return streams[0];
}