# Narciso

Narciso scrapes the reviews of webs that we call providers. It can be google, star of service, bodas.net... 
Each provider have its own code to manage puppeteer.
If the scrape execution is successful, then the reviews are stored in a json file called `/result/reviews.json`. If not it will do nothing regarding this file.
The json file will be an array of objects with the next format:
```
{
  "provider": "google",   // The service from the review comes  
  "rating": 5,   // The rating  
  "authorName": "Jane",   // The name of the reviewer  
  "content": "A very great performance and profesional"   // The text of the review  
}
```
Also, it always creates the file `./result/reviews.last.log` with the log of the last run.

Feel free to add code to scrape new providers in `/src/providers/`.

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

When Narciso runs, it will print the log in realtime to console in a flat format. To get the formatted final log at the end of the execution, add 'final-log' to the start command:
```
npm start final-log
```

### Using Docker
If you prefer to launch Narciso inside docker you can use the provided script in file `/run.sh`.
To use it, use the same commands as in the "Locally" section but prepending them with "./run.sh":

```
./run.sh npm ci
./run.sh npm start
```
or to avoid printing logs:
```
./run.sh npm start final-log
```

With run.sh you can use two environment variables to set the name of the created image and container.
The purpose of the custom container name is mainly to find which container is causing problems when you have multiple narcisos running in one system.
The purpose of the custom image name is to be able to create a custom image for some specific narciso or narcisos.

**Be careful not to make the services that you scrape angry launching Narciso very often.**

## Configuration

The configuration is done through the file `/config.ts`.
There is an example config file named `/config.example.ts`.

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
      title: "Foo in google",
      activate: true,
      timeout: 30000,
      url : 'https://www.google.com/search?q=some+search+with+opinions#lrd=0x12a482b981b3f765:0x7ca8c3c9b3eadc99,1,,,',
      provider: 'google',
      ignoreReviews: {
        byAuthorName: ['Jane Smith', 'John Doe'],
        byMinimumRating: 4,
        byMinimumCharactersCountInContent: 10,
      },
    }
  ]
}
```

As you can see it is divided in two main parts. 

### Puppeteer section
Its purpose is to configure the puppeteer process and the other to configure from which webs you want to get the reviews.
- browserLanguage: the language of the browser. The webs will get this language as the main one. String. Optional. 'en-US' if not provided.
- sandboxBrowser: open the browser in a sandboxed environment. Boolean. Optional. True if not provided.
- disableSetuidSandbox: disables the setuid sandbox of the browser. Boolean. Optional. True if not provided.
- headless: run browser without showing any kind of graphical window. Boolean. Optional. True if not provided.
- dumpio: show browser logs into console.Boolean. Optional. True if not provided.


### Webs section

Its purpose is to configure from which webs you want to get the reviews.
Is an array of web configurations. In the root of each web configuration are the fields that are common for all the providers and inside the `specific` field you can put the configurations which are specific for the provider. 
[In a following section](./README.md#add-a-new-provider) are explained the steps to add a new provider.

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

As a convention, all this fields will be followed by the `specific` field with the specific configuration of the provider if applicable.

## Generic workflow
Clone this repository to your local.
Create a configuration file as previously explained.
Test in your local system.
Go to your production system.
Clone this repo and transfer the configuration from your local.
Then, for instance, you can set a monthly cron job with final-log argument nd pipe the output to mail command, for example:
```
/narciso/location/run.sh npm start final-log | docker exec -i mymailserver mail -s "Narciso log" me@example.com
```

## Add a new provider

For instance suppose that you want to create a provider called 'thereviewhub'.

Create the directory `/src/domain/scraper/providers/thereviewhub`.

There, create a file `thereviewhub.ts` to put the function which executes the steps to get the reviews from the provider. That function must be of type `Steps` and lets say that you call that function `thereviewhubSteps` 

Now, go to `/src/domain/scraper/providers/provider.ts`.

Add the provider to be a new constituent of the Provider union:

```ts
export type Provider = 
  | 'google'
  | 'bodasnet'
  | 'thereviewhub' // <-- Added by you
```

And add the provider to the ProvidersMap to link it to the steps function that we created previously:

```ts
const providersMap: { [P in Provider]: Steps<P>} = {
    'google': googleSteps,
    'bodasnet': bodasnetSteps,
    'thereviewhub': thereviewhubSteps, // <<-- Added by you
}
```

In addition, if the provider needs specific configuration, create in the same directory a file called `thereviewhub.config.ts` and put there all the types of your needs and also you have to provide the following to ensure that the main config file is properly type-checked. Being ThereviewhubSpecificConfig the main type of the specific config of `thereviewhub` provider put in `thereviewhub.config.ts`:

```ts
declare module "../../../config/web-config.js" {
    interface SpecificsMap {
        thereviewhub: ThereviewhubSpecificConfig 
    }	
}
```

Aaaaaand finally, document the specific configuration inside `/docs/providers/thereviewhub.ts`.
