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

window.addEventListener(
  "onWidgetLoad",
  ({ detail: { channel, fieldData } }) => {
    console.log("widget loaded");
    console.log(channel, fieldData);
    getUserData(channel, fieldData);
    console.log(userData);
  }
);

function getUserData({ username, id }, { commandTriggerPhrase, jwtToken }) {
  userData.channelName = username;
  userData.channelId = id;
  userData.apiToken = jwtToken;
  userData.triggerPhrase = commandTriggerPhrase;
}

window.addEventListener(
  "onEventReceived",
  ({ detail: { event, listener } }) => {
    console.log("widget got event");
    console.log(event, listener);
    onPluginCalled(listener, event.data, pluginHandler);
  }
);

function onPluginCalled(listener, { text, ...other }, callback) {
  if (
    isMessageEvent(listener) &&
    isPrivilegedUser(other) &&
    isPluginCalled(text)
  )
    callback(other.nick, getPluginArguments(text));
}

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

async function defaultHandler({ caller }) {
  console.log(`default handler for plugin called by [${caller}]`);
  const songs = await getSongQueue();
  console.log(`Got [${songs.length}] songs`);
  await Promise.all(songs.map((e) => deleteSong(e.songId)));
  durstenfeldShuffle(songs);
  await Promise.all(songs.map((e) => queueSong(e.videoId)));
}

function handleMissingSubcommand(caller, subcommand) {
  console.error(
    `Subcommand [${subcommand}] called by [${caller}] is not recognized`
  );
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
  console.log(songIdList);
  return songIdList;
}

async function queueSong(videoId) {
  const data = await sendApiRequest(
    endpoints.songRequestQueue(userData.channelId),
    "POST",
    userData.apiToken,
    { video: videoId }
  );
  console.log(data);
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
  console.log(response);
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

function isPrivilegedUser({ nick, tags }) {
  return nick === userData.channelName || tags.mod === "1";
}

function isPluginCalled(message) {
  return message.startsWith(`!${userData.triggerPhrase}`);
}

function isMessageEvent(listener) {
  return listener === "message";
}

function onMessageEvent(listener, callback) {
  if (isMessageEvent(listener)) callback();
}

function getPluginArguments(message) {
  return message.split(" ").slice(1);
}

function durstenfeldShuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}
