export const config = {
	puppeteer : {
    		"args": ["--lang=es-ES", "--no-sandbox", "--disable-setuid-sandbox"],
		"headless": true,
		"dumpio" : true
	},
	webs : [
		{
			activate : true,
			url : 'https://www.google.com/search?q=some+search+with+opinions#lrd=0x12a482b981b3f765:0x7ca8c3c9b3eadc99,1,,,',
			provider : 'google',
			ignore_reviews : {
				by_name : ['Joh Doe', 'Foo Bar'],
				by_minimum_rating : 4,
				by_minimum_characters_count_in_content : 10
			}
		},
		{
			activate : true,
			url : 'https://www.starofservice.es/profesional/photgrapher/ibiza/34467567/michael-photo#/',
			provider : 'star_of_service',
			ignore_reviews : {
				by_name : [],
				by_minimum_rating : 4,
				by_minimum_characters_count_in_content : 10
			}
		}
		]
	}


