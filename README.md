# scraping-reviews

This app scrapes the reviews on google and star of service and put it in a json file called "reviews.json".
This json will be an array of objects with the next format:
```
{
  "source": "Star Of Service",   // The service from the review comes  
  "rating": 5,   // The rating  
  "authorName": "Jaimito",   // The name of the reviewer  
  "content": "A very great performance and profesional"   // The text of the review  
}
```
It also creates the file "reviews.last.log" with the log of the last run.

Feel free to add functions to scrape new services.

## Launching the process
### Locally
To launch the process using your local environment first install the dependencies:
```
npm ci
```
Then launch the process:
```
npm start
```

When the process runs, it will print the log to console. To prevent this behaviour add 'silent' to the commands:
```
npm start -- silent
```

### Using Docker
If you prefer to launch the process inside docker you can use the provided script in file run.sh.
To use it, use the same commands as in the "Locally" section  but prepending them with "./run.sh":

```
./run.sh npm ci
./run.sh npm start
```
or to avoid printing logs:
```
./run.sh npm start -- silent
```

Use a cron in your server to run the app once a month for example. 
Be careful not to make the services that you scrape angry launching this process very often.

## Configuration

The configuration is done through the file "config.ts".
There is an example config file named config.example.ts .

There is a command to check that the config is ok:
```
npm run check-config
```
For now, the errors are raw typescript errors, so you need to understand them.

That's how a configuration looks like:
```
{
  puppeteer: {
    browserLanguage: 'es-ES',
    sandboxBrowser: true,
    disableSetuidSandbox: true,
    headless: false,
    dumpio: true ,
  },
  webs: [
    {
      activate: true,
      title: "Foo en google",
      activate: true,
      timeout: 30000,
      url : 'https://www.google.com/search?q=some+search+with+opinions#lrd=0x12a482b981b3f765:0x7ca8c3c9b3eadc99,1,,,',
      provider: 'google',
      ignoreReviews: {
        byAuthorName: ['John Doe', 'Foo Bar'],
        byMinimumRating: 4,
        byMinimumCharactersCountInContent: 10,
      },
    }
  ]
}
```
As you can see it is divided in two main parts. 
One to configure the puppeteer process and the other to configure from which webs you want to get the reviews.
In the puppeteer section:
- browserLanguage: the language of the browser. The webs will get this language as the main one. String. Optional. 'en-US' if not provided.
- sandboxBrowser: open the browser in a sandboxed environment. Boolean. Optional. True if not provided.
- disableSetuidSandbox: disables the setuid sandbox of the browser. Boolean. Optional. True if not provided.
- headless: run browser without showing any kind of graphical window. Boolean. Optional. True if not provided.
- dumpio: show browser logs into console.Boolean. Optional. True if not provided.

The webs section is an array of web configurations. 
Each web configuration have some fields that are common for all the web configurations and then 
another fields that are specific for each provider.
That provider specific configuration should be documented inside docs/providers.
The common fields are:
- provider: Tells the scraper how to scrape the web. Each provider must provide (pun intended :D) its own code to scrape its kind of web. String. Mandatory
- activate: To activate the scraping on this web or not. Mandatory. Boolean,
- title: the title of that web config. Will be printed on logs. String. Mandatory 
- useInTests: To use this web when launching the tests. Optional. Boolean. If not provided, the first web found for the provider will be used.
- url: The url of the starting point from where to start scraping. String. Mandatory.
- timeout: Time in milliseconds to wait for a response after some action. Number. Mandatory.
- ignoreReviews: Ignore the reviews that not comply some policy. Object. Optional. If not provided all the reviews will pass the validation.
  It can have the following fields, all optional:
  -- byAuthorName: exclude reviews with this author names. String Array. Optional.
  -- byMinimumCharactersCountInContent: exclude reviews with the content shorter than the provided here: Number. Optional.
  -- byMinimumRating: exclude reviews with the rating lower than the provided. Number. Optional.

All this fields will be followed by the specific ones.
