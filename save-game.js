javascript: (() => {
    /* * * * * * * * */
    /* Configuration */
    /* * * * * * * * */
    const OUTPUT_TYPE = 'both'; /* Options: yaml, json */
    const OUTPUT_LOCATION = 'DOWNLOAD'; /* Options: DOWNLOAD, WINDOW, TAB */

    const FILE_PREFIX = "cine-battle";
    const ADDITIONAL_KEYS = ["opponent", "date"];
    /* * * * * * * * */

    const date = new Date();
    const data = collectData(date);

    if (OUTPUT_TYPE.toLowerCase() === 'both') {
        main('yaml', data, date);
        main('json', data, date);
    }
    else {
        main(OUTPUT_TYPE, data, date);
    }

function main(output_type, data, date)  {

    const doWriteOutput = OUTPUT_LOCATION.toUpperCase() === 'DOWNLOAD' ? save : openPage;
    const output = output_type.toUpperCase() === 'JSON' ? data : toYaml(data, date);

    function openPage(s, tab) {
        const wnd = OUTPUT_LOCATION.toUpperCase() === 'TAB' ? window.open("about:blank", "_blank") : window.open("about:blank", "", "_blank");
        const outString = output_type.toUpperCase() === 'JSON' ? JSON.stringify(data, undefined, 4) : s.split("\n").join("<br />");
        wnd.document.write(outString);
    }

    const fileName = ([FILE_PREFIX].concat(ADDITIONAL_KEYS.map(key => data[key]))).join('-');
    doWriteOutput(output, `${fileName}.${output_type.toLowerCase()}`);
}

function collectData(date) {
    const moviesRaw = Array.from(document.querySelectorAll(".battle-board-movie")).slice(1);
    const movies = moviesRaw.map((movie, i, arr) => {
        const name = Array.from(movie.childNodes).find(x => x.data).wholeText.trim();
        return name;
    });

    const connectionsRaw = Array.from(document.querySelectorAll(".battle-board-connections"));
    const connections = connectionsRaw.map(handleConnections);

    const game = movies.map((movie, i, arr) => {
        const skip = movie === arr[i+1];

        return {
            "name": movie,
            "connections_prev": connections[i] || [],
            "turn": arr.length - i - 1,
            "skip": skip
        };
    });

    /* metadata */
    const you = document.querySelector('.battle-score-name').innerText;
    const gameOverNodes = document.querySelector(".game-over-header").childNodes;
    const opponent = gameOverNodes[1].textContent;
    const result = gameOverNodes[0].textContent.slice(0, -5);
    const time = date.valueOf();

    const gameOverStats = document.querySelectorAll(".game-over-stat");
    const turns = gameOverStats[0].textContent.slice(17);
    const streak = gameOverStats[2].textContent.slice(10);

    const lifelines = [...document.querySelectorAll(".battle-score-lifelines")].map((p_lifelines, i, arr) => {
        return {
            "skip": Boolean(p_lifelines.querySelector(".fa-right-to-line")),
            "cast": Boolean(p_lifelines.querySelector(".fa-list")),
            "time": Boolean(p_lifelines.querySelector(".fa-clock")),
        };
    });
    const [yourLifelines, opponentLifelines] = lifelines;

    const lastMovie = movies[0];
    const movie1 = movies[movies.length-1];
    const movie2 = movies[movies.length-2];

    const yourColor = 'rgb(3, 168, 149)';
    const parity = document.querySelector(".battle-movie-1").firstChild.style.backgroundColor === yourColor;

    const skips = game.filter(movie => movie.skip);

    const yourSkip = (skips.filter(movie => movie.turn % 2 == parity)[0] ?? {})['name'] || null;
    const opponentSkip = (skips.filter(movie => movie.turn % 2 != parity)[0] ?? {})['name'] || null;

    var obj = {
        "movies": game,
        "you": you,
        "opponent": opponent,
        "your_parity": parity,
        "result": result,
        "turns": turns,
        "streak": streak,
        "last_movie": lastMovie,
        "movie1": movie1,
        "movie2": movie2,
        "your_skip": yourSkip,
        "opponent_skip": opponentSkip,
        "your_lifelines": yourLifelines,
        "opponent_lifelines": opponentLifelines,
        "date": time,
    };
    return obj;
}

function handleConnections(connections, i, arr) {
  if (connections.childNodes.length == 1 && connections.childNodes[0].childNodes.length == 1) {
    return Array({"name": null, "xCount": 0});
  }
  else {
    var cList = Array();

    const expanded = connections.querySelectorAll('.expanded-connection');
    const children = expanded.length ? expanded : connections.querySelectorAll('.battle-board-connection');
    children.forEach(connection => {
      if (connection.childNodes.length < 2) {
          cList.push({
              "name": connections.childNodes[connections.childNodes.length-1].innerText.trim(),
              "xCount": "?"
          });
      }
      else {
        cList.push({
            "name": connection.childNodes.item(0).textContent.slice(1),
            "xCount": connection.childNodes.item(1).querySelectorAll(".xmark").length
          });
      }
    });
    return cList;
  }
}

function toYaml(json, date) {
    const flatData = ["opponent", "result", "turns", "streak", "last_movie", "movie1", "movie2"].map(key => `- ${key}: ${json[key]}`);
    const nestedData = [
        `- your_skip: ${json['your_skip'] ?? "n/a"}`,
        `- opponent_skip: ${json['opponent_skip'] ?? "n/a"}`,
        `- your_lifelines: ${['skip', 'cast', 'time'].filter(x => json['your_lifelines'][x])}`,
        `- opponent_lifelines: ${['skip', 'cast', 'time'].filter(x => json['opponent_lifelines'][x])}`,
        `- date: ${date}`
    ];
    const log = json['movies'].map(movie => {
        const header = `- T${movie['turn']} [${["YOU", "OPP"][(movie['turn'] + json['your_parity']) % 2]}]`;
        if (movie['skip']) return `${header}\n- SKIP`;
        const connections = movie['connections_prev']
            .map(connection => `  - ${connection['xCount']}x: ${connection['name']}`)
            .join('\n');
        return [
            header,
            `- ${movie['name']}:`,
            `${connections}`
        ].join('\n');
    }).join('\n\n\n');
    return (["---"].concat(flatData, nestedData, ["---", log])).join('\n');
}

function save(data, filename){
    /* Code attributed to @raecoo (https://gist.github.com/raecoo/dcbac9e94198dfd0801be8a0cbb14570) */
    if(!data) {
        console.error('Console.save: No data');
        return;
    }

    if(!filename) filename = 'console.json';

    if(typeof data === "object"){
        data = JSON.stringify(data, undefined, 4);
    }

    var blob = new Blob([data], {type: 'text/json'}),
        e    = document.createEvent('MouseEvents'),
        a    = document.createElement('a');

    a.download = filename;
    a.href = window.URL.createObjectURL(blob);
    a.dataset.downloadurl =  ['text/json', a.download, a.href].join(':');
    e.initMouseEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
    a.dispatchEvent(e);
}
})()
