javascript: (() => {
    /* * * * * * * * */
    /* Configuration */
    /* * * * * * * * */
    const OUTPUT_LOCATION = 'DOWNLOAD'; /* Options: DOWNLOAD, WINDOW, TAB */

    const FILE_PREFIX = "cine-stats";
    /* * * * * * * * */

    /* Credit: https://www.richardkotze.com/top-tips/how-to-open-file-dialogue-just-using-javascript */
    const fileSelector = document.createElement('input');
    fileSelector.setAttribute('type', 'file');
    fileSelector.setAttribute('multiple', 'multiple');

    const selectDialogueLink = document.createElement('a');
    selectDialogueLink.setAttribute('href', '');
    selectDialogueLink.innerText = "Select File";

    selectDialogueLink.onclick = function () {
         fileSelector.click();
         return false;
    };
    document.body.appendChild(selectDialogueLink);
    fileSelector.onchange = aggregateData;
    selectDialogueLink.click();

    function parseBlob(blob) {
        try {
            return JSON.parse(blob);
        } catch (error) {
            return {};
        }
    }

    function aggregateData() {

        const files = fileSelector.files;
        const arr = Array.from(fileSelector.files).map(f => f.text());
        Promise.all(arr).then(values => {
            const games = values.map(parseBlob).filter(x => x['result']);

            const wins   = games.filter(game => game['result'].endsWith("WON"));
            const losses = games.filter(game => game['result'].endsWith("LOST"));
            const draws  = games.filter(game => game['result'].endsWith("DRAW"));

            const my_skips   = games.map(game => game['your_skip']).filter(Boolean);
            const opp_skips  = games.map(game => game['opponent_skip']).filter(Boolean);

            const win_movies  = wins.map(game => game['last_movie']);
            const loss_movies = losses.map(game => game['last_movie']);
            const draw_movies = draws.map(game => game['last_movie']);

            const movies     = [].concat(...games.map(game => game['movies'].slice(0, -1).filter(movie => !movie['skip']).map(movie => movie['name'])));
            const my_movies  = [].concat(...games.map(game => game.movies.slice(0, -1).map(movie => { return {'parity': game['your_parity'], 'movie': movie} }).filter(wrapper => !wrapper.movie['skip'] && wrapper.movie['turn'] % 2 == wrapper['parity']).map(wrapper => wrapper.movie.name)));
            const opp_movies = [].concat(...games.map(game => game.movies.slice(0, -1).map(movie => { return {'parity': game['your_parity'], 'movie': movie} }).filter(wrapper => !wrapper.movie['skip'] && wrapper.movie['turn'] % 2 != wrapper['parity']).map(wrapper => wrapper.movie.name)));

            const most_played = {};
            my_movies.forEach(movie => most_played[movie] = (most_played[movie] ?? 0) + 1);

            const my_movies_uniq = new Set(my_movies);
            const most_common_years = {};
            const most_common_decades = {};
            my_movies_uniq.forEach(movie => {
                const year = parseInt(movie.split(" ").at(-1).slice(1,-1));
                most_common_years[year] = (most_common_years[year] ?? 0) + 1;

                const decade = Math.floor(year / 10) * 10;
                most_common_decades[decade] = (most_common_decades[decade] ?? 0) + 1;
            });

            const printCounter = ct => Object.entries(ct).toSorted((a, b) => b[1] - a[1]).map(x => `${x[0]} (${x[1]})`).join(', ');

            const data = [
                `W/L/D: ${wins.length}/${losses.length}/${draws.length}`,
                `Win movies: ${win_movies.join(', ')}`,
                `Loss movies: ${loss_movies.join(', ')}`,
                `Draw movies: ${draw_movies.join(', ')}`,
                `My skips: ${my_skips.join(', ')}`,
                `Opponent skips: ${opp_skips.join(', ')}`,
                `Most played movies: ${printCounter(most_played)}`,
                `Most played years: ${printCounter(most_common_years)}`,
                `Most played decades: ${printCounter(most_common_decades)}`,
                `My movies: ${my_movies.join(', ')}`,
                `Opponent movies: ${my_movies.join(', ')}`,
            ].join('\n');

            const date = new Date();
            main('yaml', data, date);
        });
    };

    function main(output_type, data, date)  {
        const doWriteOutput = OUTPUT_LOCATION.toUpperCase() === 'DOWNLOAD' ? save : openPage;

        function openPage(s, tab) {
            const wnd = OUTPUT_LOCATION.toUpperCase() === 'TAB' ? window.open("about:blank", "_blank") : window.open("about:blank", "", "_blank");
            const outString = output_type.toUpperCase() === 'JSON' ? JSON.stringify(data, undefined, 4) : s.split("\n").join("<br />");
            wnd.document.write(outString);
        }

        const fileName = ([FILE_PREFIX].concat([date.valueOf()])).join('-');
        doWriteOutput(data, `${fileName}.txt`);
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
