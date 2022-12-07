/**
 * --- Script constants ---
 */
const userData = {
  channelName: "",
  channelId: "",
  apiToken: "",
  triggerPhrase: "",
  seApi: "https://api.streamelements.com/kappa/v2",
};

const endpoints = {
  songRequestQueue: (channel) =>
    `${userData.seApi}/songrequest/${channel}/queue`,
  deleteSongRequestQueue: (channel, song) =>
    `${userData.seApi}/songrequest/${channel}/queue/${song}`,
};

/**
 * --- Register events ---
 */

window.addEventListener("onWidgetLoad", ({ detail: { channel, fieldData } }) =>
  getUserData(channel, fieldData)
);

function getUserData({ username, id }, { commandTriggerPhrase, jwtToken }) {
  userData.channelName = username;
  userData.channelId = id;
  userData.apiToken = jwtToken;
  userData.triggerPhrase = commandTriggerPhrase;
}

window.addEventListener("onEventReceived", ({ detail: { event, listener } }) =>
  onPluginCalled(listener, event.data, pluginHandler)
);

/**
 * --- Event filters ---
 */

function onPluginCalled(listener, { text, ...other }, callback) {
  if (
    isMessageEvent(listener) &&
    isPrivilegedUser(other) &&
    isPluginCalled(text)
  )
    callback(other.nick, getPluginArguments(text));
}

function onMessageEvent(listener, callback) {
  if (isMessageEvent(listener)) callback();
}

/**
 * --- Register handlers ---
 */

function pluginHandler(caller, [subcommand, ...args]) {
  const subcommandHandler = {
    undefined: defaultHandler,
  };
  try {
    subcommandHandler[subcommand]({ caller, args });
  } catch (error) {
    handleMissingSubcommand(caller, subcommand);
  }
}

/**
 * --- Handlers ---
 */

async function defaultHandler() {
  const songs = await getSongQueue();
  console.log(`Got [${songs.length}] songs`);
  await deleteAllSongs(songs);
  durstenfeldShuffle(songs);
  await addAllSongs(songs);
}

function handleMissingSubcommand(caller, subcommand) {
  console.error(
    `Subcommand [${subcommand}] called by [${caller}] is not recognized`
  );
}

/**
 * --- API helpers ---
 */

async function deleteAllSongs(songs) {
  return await Promise.all(songs.map((e) => deleteSong(e.songId)));
}

async function addAllSongs(songs) {
  return await Promise.all(songs.map((e) => addSong(e.videoId)));
}

async function getSongQueue() {
  const songQueue = await sendApiRequest(
    endpoints.songRequestQueue(userData.channelId),
    "GET",
    userData.apiToken
  );
  const songIdList = songQueue.map((el) => ({
    songId: el._id,
    videoId: el.videoId,
  }));
  return songIdList;
}

async function addSong(videoId) {
  await sendApiRequest(
    endpoints.songRequestQueue(userData.channelId),
    "POST",
    userData.apiToken,
    { video: videoId }
  );
}

async function deleteSong(songId) {
  const response = await fetch(
    endpoints.deleteSongRequestQueue(userData.channelId, songId),
    {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userData.apiToken}`,
      },
    }
  );
}

async function sendApiRequest(url, method, token, body = null) {
  try {
    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: body ? JSON.stringify(body) : null,
    });
    return await response.json();
  } catch (error) {
    console.error(error);
  }
}

/**
 * --- Conditions ---
 */

function isPrivilegedUser({ nick, tags }) {
  return nick === userData.channelName || tags.mod === "1";
}

function isPluginCalled(message) {
  return message.startsWith(`!${userData.triggerPhrase}`);
}

function isMessageEvent(listener) {
  return listener === "message";
}

/**
 * --- Utils ---
 */

function getPluginArguments(message) {
  return message.split(" ").slice(1);
}

function durstenfeldShuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}
