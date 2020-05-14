const { GoogleSpreadsheet } = require('google-spreadsheet');
const creds = require('./credentials.json');
const Predictor = require('./predictions.js');
const Discord = require('discord.js');
const config = require('./config.json');
const PATTERN = {
  'Fluctuating': 0,
  'Large spike': 1,
  'Decreasing': 2,
  'Small spike': 3,
  'Unknown': 4
};
const DAYS = {
    1: 'Sunday',
    2: 'Monday AM',
    3: 'Monday PM',
    4: 'Tuesday AM',
    5: 'Tuesday PM',
    6: 'Wednesday AM',
    7: 'Wednesday PM',
    8: 'Thursday AM',
    9: 'Thursday PM',
    10: 'Friday AM',
    11: 'Friday PM',
    12: 'Saturday AM',
    13: 'Saturday PM'
}


//Creates a discord client so bot can interact
const client = new Discord.Client();

//Gathers necessary data from the google spreadsheet
const doc = new GoogleSpreadsheet(creds.acsheetid);

async function accessSpreadsheet() {
  await doc.useServiceAccountAuth({
    client_email: creds.client_email,
    private_key: creds.private_key,
  });

  await doc.loadInfo(); // loads document properties and worksheets

  const sheet = doc.sheetsById[873963957]; // picks specific turnip sheet
  await sheet.loadCells('A1:L16');
  let all_data = [];
  for (i=1; i < 12; i++) {
    let data = {};
    data['name'] = sheet.getCell(0, i).value;
    data['prev_pattern'] = sheet.getCell(15, i).value;
    data['prices'] = [];
    for (j=1; j <= 12; j++) {
        let price = parseInt(sheet.getCell(j, i).value);
        data['prices'].push(price);
    }
    data['prices'].unshift(parseInt(sheet.getCell(13, i).value));
    data['prices'].unshift(data['prices'][0]);
    all_data.push(data);
  }
  return all_data;
}

function largeSpikesMessage(data) {
    //let spikelist = [];
    let embed = new Discord.MessageEmbed()
            .setColor('#bdd9b8')
            .setTitle('Results');
    let count = 0;
    for (let i=0; i<data.length; i++) {
        let l = 0;
        data[i]['prices'].forEach(element => {if (!isNaN(element)) { l++; }});
        if (l <= 3)  continue; //skips people without enough data
        let p = new Predictor(data[i]['prices'],false,PATTERN[data[i]['prev_pattern']]);
        let results = p.analyze_possibilities();
        for (let j=0; j<results.length;j++) {
            //if ( results[j].pattern_number == 1) { spikelist.push(`[${data[i]['name']}](${generateLink(data[i]['prices'],data[i]['prev_pattern'])}) has a ${(results[j]['category_total_probability']*100).toFixed(1)}% chance to spike as high as ${results[j].weekMax} as early as ${spikeDay(results[j])}`); break; }
            if ( results[j].pattern_number == 1) { embed.addField(data[i]['name'],`[${(results[j]['category_total_probability']*100).toFixed(1)}% chance to spike as high as ${results[j].weekMax} as early as ${spikeDay(results[j])}](${generateLink(data[i]['prices'],data[i]['prev_pattern'])})`,false); count++; break; }
        }
    }
    if (count == 0) { embed.addField('Looks like nobody has a chance for a large spike this week','😢',false);};
    return embed;
}

function isEmpty(arr) {
    const filtered = arr.filter(value => value !== null && value !== '' && !isNaN(value));
    return filtered.length == 0;
};

function generateLink(prices, prev_pattern) {
    let link = 'https://turnipprophet.io/?';
    let buy_price = prices[0];
    let sell_prices = prices.slice(2);
    console.log(sell_prices);
    let searchParams = new URLSearchParams();
    let pricesParam = buy_price ? buy_price.toString() : '';

    if (!isEmpty(sell_prices)) {
        const filtered = sell_prices.map(price => isNaN(price) ? '' : price).join('.');
        pricesParam = pricesParam.concat('.', filtered);
    }

    if (pricesParam) {
        searchParams.append('prices', pricesParam);
    }

    if (prev_pattern !== 4) {
        searchParams.append('pattern', PATTERN[prev_pattern]);
    }

    return link.concat('',searchParams.toString());
}

function spikeDay(result) {
    let day = 'Dunno, got an error';
    for (i=0;i < result['prices'].length; i++) {
        if (result['prices'][i]['max'] == result['weekMax']) { return DAYS[i]; }
    }
    return day;
}

function createEmbed(list) {
    const embed = new Discord.MessageEmbed()
        .setColor('#bdd9b8')
        .setTitle('Results');
    return embed;
}

client.once('ready', () => {
	console.log('Ready!');
});

client.on('message', message => {
    if (!message.content.startsWith(config.prefix) || message.author.bot) return;
    if (message.content.toLowerCase() === '!turnip' || message.content.toLowerCase() === '!turnips') {
        message.channel.send('Calculating, please wait...');
        largeSpikes(message);
    }
});

function largeSpikes(message) {
    accessSpreadsheet()
        .then(data => largeSpikesMessage(data))
        //.then(list => createEmbed(list))
        .then(msg => message.channel.send(msg))
        .then(() => console.log('done'))
        .catch(console.error);
}

client.login(config.token);