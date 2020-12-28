const fs = require('fs').promises;
const fetch = require('node-fetch');
const cheerio = require('cheerio');

async function getWikiBody()
{
    return (await fetch('https://developer.valvesoftware.com/wiki/List_of_TF2_console_commands_and_variables')).text();
}

async function scrapeData()
{
    const data = await getWikiBody();
    const $ = cheerio.load(data);
    
    const version = $('#mw-content-text span').first().text();
    
    const cvars = [];
    $('pre').each(function(i, el)
    {
        const lines = $(this).text().split('\n').filter(line => line.length > 0);
        for(const line of lines)
        {
            const parts = line.split(':');
            const [name, defValue, flags] = parts.splice(0, 3).map(v => v.trim());
            // Remove duplicates
            if(cvars.filter(v => v.name === name).length !== 0)
            {
                return;
            }
            const desc = parts.join(':').trim();
            
            cvars.push({
                name,
                defValue,
                flags: flags.split(', ').filter(v => v.length !== 0)
                            .map(v => v.substr(1, v.length - 2)),
                desc
            });
        }
    });
    return {cvars, version};
}

(async () =>
{
    const {cvars, version} = await scrapeData();
    console.log(`Loaded ${cvars.length} cvars ${version}`);
    try
    {
        await fs.mkdir('./dist');
    }
    catch(ignored) {}
    await fs.writeFile('./dist/cvars.json', JSON.stringify(cvars));
    await fs.writeFile('./dist/cvars-formatted.json', JSON.stringify(cvars, null, 4));
})();
