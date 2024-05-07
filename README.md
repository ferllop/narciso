# Narciso

Narciso scrapes the reviews of webs that we call providers. It can be google, star of service, bodas.net... 
Each provider have its own code to manage puppeteer.
Then the reviews are stored in a json file called "reviews.json".
This json will be an array of objects with the next format:
```
{
  "provider": "starOfService",   // The service from the review comes  
  "rating": 5,   // The rating  
  "authorName": "Jaimito",   // The name of the reviewer  
  "content": "A very great performance and profesional"   // The text of the review  
}
```
It also creates the file "reviews.last.log" with the log of the last run.

Feel free to add code to scrape new providers.

## Launching the process
### Locally
To launch Narciso using your local environment first install the dependencies:
```
npm ci
```
Then launch Narciso:
```
npm start
```

When Narciso runs, it will print the log to console. To prevent this behaviour add 'silent' to the start command:
```
npm start -- silent
```

### Using Docker
If you prefer to launch Narciso inside docker you can use the provided script in file run.sh.
To use it, use the same commands as in the "Locally" section but prepending them with "./run.sh":

```
./run.sh npm ci
./run.sh npm start
```
or to avoid printing logs:
```
./run.sh npm start -- silent
```

With run.sh you can use two environment variables to set the name of the created image and container.
The purpose of the custom container name is mainly to find which container is causing problems when you have multiple narcisos running in one system.
The purpose of the custom image name is to be able to create a custom image for some specific narciso or narcisos.

Use a cron in your server to run Narciso once a month for example.
Be careful not to make the services that you scrape angry launching Narciso very often.

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
- timeout: Time in milliseconds to wait for a response after some action. Number. Optional. If not provided the default will be 30000 milliseconds (30 seconds).
- ignoreReviews: Ignore the reviews that not comply some policy. Object. Optional. If not provided all the reviews will pass the validation.
  It can have the following fields, all optional:
  -- byAuthorName: exclude reviews with this author names. String Array. Optional. If not provided all author names are valid.
  -- byMinimumCharactersCountInContent: exclude reviews with the content shorter than the provided here: Number. Optional. If not provided even empty content is valid.
  -- byMinimumRating: exclude reviews with the rating lower than the provided. Number. Optional. If not provided even a rating of 0 is valid.

All this fields will be followed by the specific ones.

## Generic workflow
Clone this repository to your local.
Create a configuration file as previously explained.
Test in your local system.
Go to your production system.
Clone this repo and transfer the configuration from your local.
Set a cronjob to run monthly

